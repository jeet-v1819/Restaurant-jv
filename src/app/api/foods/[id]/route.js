import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { activityLog } from '@/lib/activity-log';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const food = await prisma.foodItem.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!food) {
      return NextResponse.json({ error: 'Food item not found' }, { status: 404 });
    }
    return NextResponse.json(food);
  } catch (error) {
    console.error('Food GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch food item' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const food = await prisma.foodItem.findUnique({ where: { id } });
    if (!food) {
      return NextResponse.json({ error: 'Food item not found' }, { status: 404 });
    }

    const form = await req.formData();
    const data = {};
    if (form.get('name') !== null) data.name = form.get('name');
    if (form.get('description') !== null) data.description = form.get('description') || undefined;
    if (form.get('price') !== null) data.price = Number(form.get('price'));
    if (form.get('categoryId') !== null) data.categoryId = form.get('categoryId');
    if (form.get('isAvailable') !== null) data.isAvailable = form.get('isAvailable') === 'true';
    if (form.get('isFeatured') !== null) data.isFeatured = form.get('isFeatured') === 'true';
    if (form.get('preparationTime') !== null) {
      data.preparationTime = form.get('preparationTime') ? Number(form.get('preparationTime')) : null;
    }
    if (form.get('image') !== null) data.image = form.get('image') || undefined;

    const updated = await prisma.foodItem.update({ where: { id }, data, include: { category: true } });

    await activityLog(session.user.id, 'UPDATE', 'FoodItem', id, data);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Food PUT error:', error);
    return NextResponse.json({ error: 'Failed to update food item' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const food = await prisma.foodItem.findUnique({ where: { id } });
    if (!food) {
      return NextResponse.json({ error: 'Food item not found' }, { status: 404 });
    }

    await prisma.foodItem.delete({ where: { id } });

    await activityLog(session.user.id, 'DELETE', 'FoodItem', id, { name: food.name });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Food DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete food item' }, { status: 500 });
  }
}
