import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { activityLog } from '@/lib/activity-log';

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, image, isActive } = body;

    const category = await prisma.foodCategory.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const data = {};
    if (name !== undefined) {
      const slug = String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+$/, '');
      const existing = await prisma.foodCategory.findUnique({ where: { slug } });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
      }
      data.name = name;
      data.slug = slug;
    }
    if (image !== undefined) data.image = image;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await prisma.foodCategory.update({ where: { id }, data });

    await activityLog(session.user.id, 'UPDATE', 'FoodCategory', id, data);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Category PUT error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const category = await prisma.foodCategory.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    await prisma.foodCategory.delete({ where: { id } });

    await activityLog(session.user.id, 'DELETE', 'FoodCategory', id, { name: category.name });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Category DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
