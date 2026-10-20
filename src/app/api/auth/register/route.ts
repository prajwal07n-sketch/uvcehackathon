import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { isAcademicEmail, isValidUSN } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      usn,
      department,
      semester,
      phone,
      password,
      role = 'STUDENT',
    } = body;

    // 1. Mandatory Fields Validation
    if (!name || !email || !usn || !department || !password) {
      return NextResponse.json(
        { error: 'Name, Academic Email, USN/Roll Number, Department, and Password are required fields.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsn = usn.toUpperCase().trim();

    // 2. Email Validation
    if (!isAcademicEmail(cleanEmail)) {
      return NextResponse.json(
        {
          error:
            'Please provide a valid email address.',
        },
        { status: 400 }
      );
    }

    // 3. USN / Roll Number Format Validation
    if (!isValidUSN(cleanUsn)) {
      return NextResponse.json(
        {
          error:
            'Invalid University Seat / Roll Number. Expected format: 1UV22EC012, DRAIT-2026, or your university roll number.',
        },
        { status: 400 }
      );
    }

    // 4. Password Strength Check
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters in length.' },
        { status: 400 }
      );
    }

    // 5. Duplicate Email or USN Check
    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with this institutional email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    const existingUsn = await prisma.user.findUnique({
      where: { usn: cleanUsn },
    });

    if (existingUsn) {
      return NextResponse.json(
        { error: 'This University Seat Number (USN) is already registered in the campus directory.' },
        { status: 409 }
      );
    }

    // 6. Hash Password with bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // 7. Create User
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        usn: cleanUsn,
        department: department.trim(),
        semester: semester ? parseInt(semester, 10) : 6,
        phone: phone ? phone.trim() : null,
        passwordHash,
        role: role === 'LAB_ADMIN' ? 'LAB_ADMIN' : 'STUDENT',
        isVerified: true,
        trustScore: 100, // Base campus trust score
        image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      },
      select: {
        id: true,
        name: true,
        email: true,
        usn: true,
        department: true,
        role: true,
        trustScore: true,
        isVerified: true,
        image: true,
      },
    });

    const response = NextResponse.json({
      message: 'Institutional account verified and created successfully! Welcome to Campus-Share.',
      user: newUser,
    });

    // Set cookie for automatic demo switcher parity
    response.cookies.set('campus_user_id', newUser.id, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during student registration.' },
      { status: 500 }
    );
  }
}
