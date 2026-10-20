import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    // Allow inspection in demo mode
    const [
      hardwareCount,
      cadCount,
      userCount,
      activeTransactionsCount,
      pendingCount,
      categoryStats,
      recentTransactions,
      hardwareItems,
    ] = await Promise.all([
      prisma.hardwareItem.count(),
      prisma.cadResource.count(),
      prisma.user.count(),
      prisma.rentalTransaction.count({ where: { status: 'CHECKED_OUT' } }),
      prisma.rentalTransaction.count({ where: { status: 'PENDING' } }),
      prisma.hardwareItem.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
      prisma.rentalTransaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          hardware: { select: { title: true, campusLocation: true } },
          borrower: { select: { name: true, department: true, trustScore: true } },
        },
      }),
      prisma.hardwareItem.findMany({
        include: {
          owner: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      stats: {
        hardwareCount,
        cadCount,
        userCount,
        activeTransactionsCount,
        pendingCount,
      },
      categoryStats,
      recentTransactions,
      hardwareItems,
      currentUser: user,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
