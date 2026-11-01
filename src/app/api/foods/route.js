import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { activityLog } from '@/lib/activity-log';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const available = searchParams.get('available');
    const search = searchParams.get('search');

    const where = {};
    if (category) where.categorySlug = category;
    if (featured === 'true') where.isFeatured = true;
    if (available !== null && available !== undefined) where.isAvailable = available === 'true';
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const foods = await prisma.foodItem.findMany({
      where,
      include: { category: true },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(foods);
  } catch (error) {
    console.error('Foods GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch foods' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const form = await req.formData();
    const name = form.get('name');
    const description = form.get('description') || null;
    const price = form.get('price');
    const categoryId = form.get('categoryId');
    const isAvailable = form.get('isAvailable') === 'true';
    const isFeatured = form.get('isFeatured') === 'true';
    const preparationTime = form.get('preparationTime') ? Number(form.get('preparationTime')) : null;
    const image = form.get('image') || null;

    if (!name || !price || !categoryId) {
      return NextResponse.json({ error: 'Name, price and category are required' }, { status: 400 });
    }

    const category = await prisma.foodCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const food = await prisma.foodItem.create({
      data: {
        name,
        description,
        price: Number(price),
        image,
        categoryId,
        isAvailable,
        isFeatured,
        preparationTime,
      },
      include: { category: true },
    });

    await activityLog(session.user.id, 'CREATE', 'FoodItem', food.id, { name, price: Number(price) });

    return NextResponse.json(food, { status: 201 });
  } catch (error) {
    console.error('Food POST error:', error);
    return NextResponse.json({ error: 'Failed to create food item' }, { status: 500 });
  }
}
