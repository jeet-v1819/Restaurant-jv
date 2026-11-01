import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { activityLog } from '@/lib/activity-log';

export async function GET() {
  try {
    const categories = await prisma.foodCategory.findMany({
      where: { isActive: true },
      include: { _count: { select: { items: { where: { isAvailable: true } } } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, image } = body;
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const slug = String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+$/, '');

    const existing = await prisma.foodCategory.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }

    const category = await prisma.foodCategory.create({
      data: { name, slug, image },
    });

    await activityLog(session.user.id, 'CREATE', 'FoodCategory', category.id, { name });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Category POST error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
