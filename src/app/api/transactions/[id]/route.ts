import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;

    const tx = await prisma.rentalTransaction.findUnique({
      where: { id },
      include: {
        hardware: {
          include: {
            owner: true,
          },
        },
        borrower: true,
      },
    });

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ transaction: tx });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;

    const existingTx = await prisma.rentalTransaction.findUnique({
      where: { id },
      include: {
        hardware: true,
        borrower: true,
      },
    });

    if (!existingTx) {
      return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 });
    }

    const isLender = existingTx.hardware.ownerId === user.id || user.role === 'LAB_ADMIN';
    const isBorrower = existingTx.borrowerId === user.id;

    if (!isLender && !isBorrower) {
      return NextResponse.json({ error: 'Unauthorized to modify this transaction' }, { status: 403 });
    }

    const body = await req.json();
    const { nextStatus, meetupSpot, handoverNotes, conditionPhotoUrl } = body;

    // Validate Status Transitions
    if (nextStatus === 'APPROVED') {
      if (!isLender) {
        return NextResponse.json({ error: 'Only the item owner or lab coordinator can approve requests' }, { status: 403 });
      }
      if (existingTx.status !== 'PENDING') {
        return NextResponse.json({ error: `Cannot approve transaction in status: ${existingTx.status}` }, { status: 400 });
      }

      const updated = await prisma.rentalTransaction.update({
        where: { id },
        data: {
          status: 'APPROVED',
          meetupSpot: meetupSpot || existingTx.meetupSpot || 'Central Library Ground Floor',
          handoverNotes: handoverNotes || existingTx.handoverNotes,
        },
      });

      return NextResponse.json({
        message: 'Request approved! Campus meetup location notified to borrower.',
        transaction: updated,
      });
    }

    if (nextStatus === 'CHECKED_OUT') {
      // Either party can verify handover on site
      if (existingTx.status !== 'APPROVED') {
        return NextResponse.json({ error: 'Item must be APPROVED before physical handover checkout' }, { status: 400 });
      }

      const [updatedTx] = await prisma.$transaction([
        prisma.rentalTransaction.update({
          where: { id },
          data: {
            status: 'CHECKED_OUT',
            handoverNotes: handoverNotes || existingTx.handoverNotes,
            conditionPhotoUrl: conditionPhotoUrl || existingTx.conditionPhotoUrl,
          },
        }),
        prisma.hardwareItem.update({
          where: { id: existingTx.hardwareId },
          data: { status: 'BOOKED' },
        }),
      ]);

      return NextResponse.json({
        message: 'Handover verified! Component is now actively checked out.',
        transaction: updatedTx,
      });
    }

    if (nextStatus === 'RETURNED') {
      if (!isLender) {
        return NextResponse.json({ error: 'Only the lender/lab coordinator can confirm safe return' }, { status: 403 });
      }
      if (existingTx.status !== 'CHECKED_OUT') {
        return NextResponse.json({ error: 'Only actively checked out items can be marked returned' }, { status: 400 });
      }

      // Check if returned on time or late
      const now = new Date();
      const isLate = now > new Date(existingTx.endDate);
      const borrowerTrustDelta = isLate ? -15 : +15; // Late returns deduct points, on-time adds +15 points!
      const lenderTrustDelta = +10; // Community contribution reward

      const [updatedTx] = await prisma.$transaction([
        prisma.rentalTransaction.update({
          where: { id },
          data: {
            status: 'RETURNED',
            handoverNotes: `${existingTx.handoverNotes || ''} | Safe return verified on ${now.toLocaleDateString()}. Condition verified.`,
          },
        }),
        prisma.hardwareItem.update({
          where: { id: existingTx.hardwareId },
          data: { status: 'AVAILABLE' },
        }),
        prisma.user.update({
          where: { id: existingTx.borrowerId },
          data: { trustScore: { increment: borrowerTrustDelta } },
        }),
        prisma.user.update({
          where: { id: existingTx.hardware.ownerId },
          data: { trustScore: { increment: lenderTrustDelta } },
        }),
      ]);

      return NextResponse.json({
        message: `Safe return confirmed! Hardware is now AVAILABLE. Borrower ${isLate ? '-15 (late)' : '+15 (on-time)'} Trust Score. Lender +10 Trust Score.`,
        transaction: updatedTx,
      });
    }

    if (nextStatus === 'CANCELLED' || nextStatus === 'REJECTED') {
      const updated = await prisma.rentalTransaction.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Restore hardware status if it was locked
      await prisma.hardwareItem.update({
        where: { id: existingTx.hardwareId },
        data: { status: 'AVAILABLE' },
      });

      return NextResponse.json({
        message: `Transaction ${nextStatus.toLowerCase()} successfully.`,
        transaction: updated,
      });
    }

    return NextResponse.json({ error: 'Invalid target status provided' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
