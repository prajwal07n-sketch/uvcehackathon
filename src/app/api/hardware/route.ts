import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    const status = searchParams.get('status');
    const search = searchParams.get('q');

    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (condition && condition !== 'ALL') {
      where.condition = condition;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { campusLocation: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const items = await prisma.hardwareItem.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            trustScore: true,
            role: true,
            avatar: true,
          },
        },
        transactions: {
          where: {
            status: { in: ['APPROVED', 'CHECKED_OUT'] },
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      category,
      description,
      specs,
      condition = 'GOOD',
      maintenanceFee = 0,
      securityDeposit = 0,
      campusLocation,
      imageUrl,
    } = body;

    if (!title || !category || !campusLocation) {
      return NextResponse.json(
        { error: 'Title, category, and campus pickup location are required' },
        { status: 400 }
      );
    }

    // Format specs as JSON string
    let specsString = '{}';
    if (typeof specs === 'object') {
      specsString = JSON.stringify(specs);
    } else if (typeof specs === 'string') {
      specsString = specs;
    }

    const newItem = await prisma.hardwareItem.create({
      data: {
        title,
        category,
        description,
        specs: specsString,
        condition,
        maintenanceFee: parseFloat(maintenanceFee) || 0,
        securityDeposit: parseFloat(securityDeposit) || 0,
        campusLocation,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=600&auto=format&fit=crop&q=80',
        status: 'AVAILABLE',
        ownerId: user.id,
      },
    });

    // Reward owner with +10 Trust Score for contributing hardware to campus inventory
    await prisma.user.update({
      where: { id: user.id },
      data: { trustScore: { increment: 10 } },
    });

    return NextResponse.json({
      message: 'Hardware item listed successfully! +10 Campus Trust Score awarded.',
      item: newItem,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create item' }, { status: 500 });
  }
}
