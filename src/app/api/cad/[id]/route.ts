import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;

    const resource = await prisma.cadResource.findUnique({
      where: { id },
      include: {
        uploader: {
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
      },
    });

    if (!resource) {
      return NextResponse.json({ error: 'CAD resource not found' }, { status: 404 });
    }

    return NextResponse.json({ resource });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
