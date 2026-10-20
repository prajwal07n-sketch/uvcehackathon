import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, isValidUSN } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in first to complete your onboarding.' }, { status: 401 });
    }

    const body = await req.json();
    const { usn, department, semester, phone } = body;

    if (!usn || !department) {
      return NextResponse.json({ error: 'USN and Department are required.' }, { status: 400 });
    }

    const cleanUsn = usn.toUpperCase().trim();

    if (!isValidUSN(cleanUsn)) {
      return NextResponse.json(
        { error: 'Invalid University Seat Number (USN). Expected format: 1UV22EC012' },
        { status: 400 }
      );
    }

    // Check if USN is taken by another account
    const existing = await prisma.user.findFirst({
      where: {
        usn: cleanUsn,
        NOT: { id: user.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This USN is already registered with another student account.' },
        { status: 409 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        usn: cleanUsn,
        department: department.trim(),
        semester: semester ? parseInt(semester, 10) : 6,
        phone: phone ? phone.trim() : user.phone,
        isVerified: true,
      },
    });

    return NextResponse.json({
      message: 'Campus profile completed successfully! Hardware lending and CAD access unlocked.',
      user: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Onboarding update failed' }, { status: 500 });
  }
}
