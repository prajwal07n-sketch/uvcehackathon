import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'all'; // 'borrowed', 'lent', 'all'

    let whereCondition: any = {};

    if (scope === 'borrowed') {
      whereCondition = { borrowerId: user.id };
    } else if (scope === 'lent') {
      whereCondition = { hardware: { ownerId: user.id } };
    } else {
      whereCondition = {
        OR: [{ borrowerId: user.id }, { hardware: { ownerId: user.id } }],
      };
    }

    const transactions = await prisma.rentalTransaction.findMany({
      where: whereCondition,
      include: {
        hardware: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                trustScore: true,
                role: true,
              },
            },
          },
        },
        borrower: {
          select: {
            id: true,
            name: true,
            email: true,
            usn: true,
            department: true,
            trustScore: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ transactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to borrow campus hardware' }, { status: 401 });
    }

    const body = await req.json();
    const { hardwareId, startDate, endDate, notes } = body;

    if (!hardwareId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Hardware ID, start date, and return date are required.' },
        { status: 400 }
      );
    }

    const reqStart = new Date(startDate);
    const reqEnd = new Date(endDate);

    if (isNaN(reqStart.getTime()) || isNaN(reqEnd.getTime())) {
      return NextResponse.json({ error: 'Invalid start or return date format.' }, { status: 400 });
    }

    if (reqEnd <= reqStart) {
      return NextResponse.json(
        { error: 'Return date must be strictly after the start date.' },
        { status: 400 }
      );
    }

    const hardware = await prisma.hardwareItem.findUnique({
      where: { id: hardwareId },
    });

    if (!hardware) {
      return NextResponse.json({ error: 'Hardware component not found.' }, { status: 404 });
    }

    if (hardware.ownerId === user.id) {
      return NextResponse.json(
        { error: 'You are already the owner of this campus hardware item.' },
        { status: 400 }
      );
    }

    if (hardware.status === 'MAINTENANCE') {
      return NextResponse.json(
        { error: 'This hardware item is currently under lab maintenance/calibration.' },
        { status: 400 }
      );
    }

    // Double-booking conflict check:
    // Conflict exists if an approved or active checkout overlaps with [reqStart, reqEnd]
    // Overlap formula: (existing.startDate < reqEnd) AND (existing.endDate > reqStart)
    const conflictingBooking = await prisma.rentalTransaction.findFirst({
      where: {
        hardwareId,
        status: { in: ['APPROVED', 'CHECKED_OUT'] },
        AND: [
          { startDate: { lt: reqEnd } },
          { endDate: { gt: reqStart } },
        ],
      },
      include: {
        borrower: {
          select: { name: true, department: true },
        },
      },
    });

    if (conflictingBooking) {
      const confStart = new Date(conflictingBooking.startDate).toLocaleDateString();
      const confEnd = new Date(conflictingBooking.endDate).toLocaleDateString();
      return NextResponse.json(
        {
          error: `Double-Booking Conflict: Item is already reserved or checked out between ${confStart} and ${confEnd}. Please choose alternative dates.`,
          conflict: conflictingBooking,
        },
        { status: 409 }
      );
    }

    const newTransaction = await prisma.rentalTransaction.create({
      data: {
        hardwareId,
        borrowerId: user.id,
        startDate: reqStart,
        endDate: reqEnd,
        status: 'PENDING',
        handoverNotes: notes || 'Standard university project usage request.',
        meetupSpot: hardware.campusLocation,
      },
      include: {
        hardware: true,
      },
    });

    return NextResponse.json({
      message: 'Borrow request submitted successfully! Awaiting owner approval.',
      transaction: newTransaction,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
