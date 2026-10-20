import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;

    const item = await prisma.hardwareItem.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            usn: true,
            department: true,
            trustScore: true,
            role: true,
            avatar: true,
          },
        },
        transactions: {
          orderBy: { startDate: 'asc' },
          include: {
            borrower: {
              select: {
                id: true,
                name: true,
                trustScore: true,
                department: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Hardware item not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;

    const existing = await prisma.hardwareItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Only owner or LAB_ADMIN can update
    if (existing.ownerId !== user.id && user.role !== 'LAB_ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await prisma.hardwareItem.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        category: body.category ?? existing.category,
        description: body.description ?? existing.description,
        status: body.status ?? existing.status,
        condition: body.condition ?? existing.condition,
        campusLocation: body.campusLocation ?? existing.campusLocation,
        maintenanceFee: body.maintenanceFee !== undefined ? parseFloat(body.maintenanceFee) : existing.maintenanceFee,
        securityDeposit: body.securityDeposit !== undefined ? parseFloat(body.securityDeposit) : existing.securityDeposit,
        specs: body.specs ? (typeof body.specs === 'object' ? JSON.stringify(body.specs) : body.specs) : existing.specs,
      },
    });

    return NextResponse.json({ item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;

    const existing = await prisma.hardwareItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (existing.ownerId !== user.id && user.role !== 'LAB_ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    await prisma.hardwareItem.delete({ where: { id } });
    return NextResponse.json({ message: 'Hardware listing deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
