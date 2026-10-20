import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;

    const resource = await prisma.cadResource.findUnique({
      where: { id },
    });

    if (!resource) {
      return NextResponse.json({ error: 'CAD resource not found' }, { status: 404 });
    }

    const updated = await prisma.cadResource.update({
      where: { id },
      data: {
        downloadsCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      message: 'Download registered',
      downloadsCount: updated.downloadsCount,
      fileUrl: updated.fileUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
