import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format');
    const software = searchParams.get('software');
    const search = searchParams.get('q');

    const where: any = {};

    if (format && format !== 'ALL') {
      where.fileFormat = format;
    }
    if (software && software !== 'ALL') {
      where.softwareUsed = { contains: software };
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { softwareUsed: { contains: search } },
        { materialRecommendation: { contains: search } },
      ];
    }

    const resources = await prisma.cadResource.findMany({
      where,
      include: {
        uploader: {
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
      },
      orderBy: { downloadsCount: 'desc' },
    });

    return NextResponse.json({ resources });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in with your campus account' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      fileUrl,
      previewMeshUrl,
      fileFormat = 'STL',
      softwareUsed,
      materialRecommendation,
      infillPercent = 25,
      toleranceNotes,
      licenseType = 'CC-BY-SA 4.0',
      fileSize = '1.8 MB',
    } = body;

    if (!title || !fileUrl || !softwareUsed || !materialRecommendation) {
      return NextResponse.json(
        { error: 'Title, file URL, software tool, and recommended material are required.' },
        { status: 400 }
      );
    }

    const newResource = await prisma.cadResource.create({
      data: {
        title,
        description,
        fileUrl,
        previewMeshUrl: previewMeshUrl || fileUrl,
        fileFormat,
        softwareUsed,
        materialRecommendation,
        infillPercent: parseInt(infillPercent, 10) || 25,
        toleranceNotes: toleranceNotes || 'Standard 0.2mm tolerance recommended.',
        licenseType,
        downloadsCount: 0,
        fileSize,
        uploaderId: user.id,
      },
    });

    // Reward uploader with +15 Campus Trust Score
    await prisma.user.update({
      where: { id: user.id },
      data: { trustScore: { increment: 15 } },
    });

    return NextResponse.json({
      message: 'CAD model published to campus repository! +15 Trust Score awarded.',
      resource: newResource,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
