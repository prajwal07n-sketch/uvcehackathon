import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, isCampusEmail } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      usn: true,
      department: true,
      role: true,
      trustScore: true,
      avatar: true,
    },
    orderBy: { trustScore: 'desc' },
  });

  return NextResponse.json({
    user,
    availableUsers: allUsers,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, usn, department, role = 'STUDENT' } = body;

    if (!name || !email || !usn || !department) {
      return NextResponse.json(
        { error: 'All fields (Name, Campus Email, USN, Department) are required.' },
        { status: 400 }
      );
    }

    // Verify institutional domain
    if (!isCampusEmail(email)) {
      return NextResponse.json(
        {
          error:
            'Access Restricted: Registration requires a verified institutional campus email (.edu or .ac.in domain).',
        },
        { status: 403 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { usn }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A student account with this institutional email or USN already exists.' },
        { status: 409 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        usn,
        department,
        role: role === 'LAB_ADMIN' ? 'LAB_ADMIN' : 'STUDENT',
        trustScore: 100, // Initial base trust score
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      },
    });

    const response = NextResponse.json({
      message: 'Institutional account verified and created successfully.',
      user: newUser,
    });

    // Set cookie for instant login
    response.cookies.set('campus_user_id', newUser.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
