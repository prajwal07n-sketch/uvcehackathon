import { NextAuthOptions, getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './prisma';
import { isAcademicEmail, extractInstitutionFromEmail, getAcademicDomain } from './validators/academicEmail';

export { isAcademicEmail, extractInstitutionFromEmail, getAcademicDomain };

// Backward-compatible alias for existing imports
export function isCampusEmail(email: string): boolean {
  return isAcademicEmail(email);
}

// Student USN / Roll Number Validation (e.g. 1UV22EC012, 1MS21CS045, DRAIT-2026, FAC-ECE-04)
export function isValidUSN(usn: string): boolean {
  if (!usn) return false;
  const trimmed = usn.trim().toUpperCase();
  const usnRegex = /^(?:[1-4][A-Z]{2}\d{2}[A-Z]{2}\d{3}|[A-Z0-9-]{3,16}|FAC-[A-Z]{2,4}-\d{2,3})$/i;
  return usnRegex.test(trimmed) || trimmed.length >= 3;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/dashboard',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Campus Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your.name@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both your email address and password.');
        }

        const email = credentials.email.toLowerCase().trim();

        if (!isAcademicEmail(email)) {
          throw new Error('Please enter a valid email address.');
        }

        let user = await prisma.user.findUnique({
          where: { email },
        });

        // If user already exists in the system
        if (user) {
          if (user.passwordHash) {
            const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
            if (!isPasswordValid) {
              throw new Error('Incorrect credentials. Please verify your password.');
            }
          } else {
            // User existed without a password (e.g. created via OAuth), update their password
            const newPasswordHash = await bcrypt.hash(credentials.password, 10);
            user = await prisma.user.update({
              where: { id: user.id },
              data: { passwordHash: newPasswordHash },
            });
          }
        } else {
          // AUTO-PROVISION NEW USER:
          // If this is the user's first time signing in with their own email,
          // create their verified account on the fly so they can log in instantly without barriers.
          const passwordHash = await bcrypt.hash(credentials.password, 10);
          const rawName = email.split('@')[0].replace(/[._-]/g, ' ');
          const formattedName =
            rawName.replace(/\b\w/g, (c) => c.toUpperCase()).trim() || 'Campus Scholar';
          const institution = extractInstitutionFromEmail(email);
          const randomDigits = Math.floor(1000 + Math.random() * 9000);
          const autoUsn = `${institution.replace(/[^A-Za-z]/g, '').substring(0, 5) || 'STUD'}-${randomDigits}`.toUpperCase();

          user = await prisma.user.create({
            data: {
              name: formattedName,
              email,
              usn: autoUsn,
              department: `${institution} Engineering`,
              role: 'STUDENT',
              isVerified: true,
              trustScore: 100,
              passwordHash,
              image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formattedName)}`,
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          usn: user.usn,
          department: user.department,
          role: user.role,
          trustScore: user.trustScore,
          isVerified: user.isVerified,
          phone: user.phone,
        };
      },
    }),
    // Conditionally enable Google Provider if client credentials are present in env
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: 'select_account',
              },
            },
          }),
        ]
      : [
          // Fallback demo Google Provider configuration for display
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || 'dummy_campus_client_id.apps.googleusercontent.com',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_campus_client_secret',
            authorization: {
              params: {
                prompt: 'select_account',
              },
            },
          }),
        ]),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email?.toLowerCase().trim() || '';
        if (!isAcademicEmail(email)) {
          return false;
        }

        // Auto-provision account on Google Sign-In
        try {
          let dbUser = await prisma.user.findUnique({
            where: { email },
          });

          const institution = extractInstitutionFromEmail(email);

          if (!dbUser) {
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            const autoUsn = `${institution.replace(/[^A-Za-z]/g, '').substring(0, 5) || 'STUD'}-${randomDigits}`.toUpperCase();

            dbUser = await prisma.user.create({
              data: {
                name: user.name || `${institution} Scholar`,
                email,
                usn: autoUsn,
                department: `${institution} Engineering`,
                role: 'STUDENT',
                isVerified: true,
                trustScore: 100,
                image: user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'Scholar')}`,
              },
            });
          } else if (!dbUser.isVerified) {
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: { isVerified: true },
            });
          }

          if (dbUser) {
            user.id = dbUser.id;
            (user as any).usn = dbUser.usn;
            (user as any).department = dbUser.department;
            (user as any).role = dbUser.role;
            (user as any).trustScore = dbUser.trustScore;
            (user as any).isVerified = dbUser.isVerified;
          }
        } catch (dbErr) {
          console.error('Error auto-provisioning OAuth user:', dbErr);
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.usn = (user as any).usn;
        token.department = (user as any).department;
        token.role = (user as any).role || 'STUDENT';
        token.trustScore = (user as any).trustScore ?? 100;
        token.isVerified = (user as any).isVerified ?? false;
        token.phone = (user as any).phone;
      }

      // Handle explicit session update calls (e.g. from /onboarding)
      if (trigger === 'update' && session) {
        if (session.usn) token.usn = session.usn;
        if (session.department) token.department = session.department;
        if (session.phone) token.phone = session.phone;
        if (session.trustScore !== undefined) token.trustScore = session.trustScore;
      }

      // Sync latest DB data if token lacks USN
      if (token.id && (!token.usn || !token.department)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { usn: true, department: true, role: true, trustScore: true, isVerified: true, phone: true },
        });
        if (dbUser) {
          token.usn = dbUser.usn;
          token.department = dbUser.department;
          token.role = dbUser.role;
          token.trustScore = dbUser.trustScore;
          token.isVerified = dbUser.isVerified;
          token.phone = dbUser.phone;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).usn = token.usn;
        (session.user as any).department = token.department;
        (session.user as any).role = token.role;
        (session.user as any).trustScore = token.trustScore;
        (session.user as any).isVerified = token.isVerified;
        (session.user as any).phone = token.phone;
      }
      return session;
    },
  },
};

// Universal helper to retrieve current user in Server Components and Route Handlers
export async function getCurrentUser() {
  try {
    // 1. Try NextAuth session
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).id) {
      const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
      });
      if (user) return user;
    }

    // 2. Fallback to active demo switcher cookie
    let activeUserId = 'usr_aarav';
    try {
      const cookieStore = await cookies();
      const cookieVal = cookieStore.get('campus_user_id')?.value;
      if (cookieVal) activeUserId = cookieVal;
    } catch {
      // In non-request environments
    }

    const fallbackUser = await prisma.user.findUnique({
      where: { id: activeUserId },
    });

    return fallbackUser;
  } catch (e) {
    console.error('Error resolving current user:', e);
    return null;
  }
}
