import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { activityLog } from '@/lib/activity-log';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where = {};
    if (status) where.status = status;

    const tables = await prisma.restaurantTable.findMany({
      where,
      include: {
        _count: { select: { orders: { where: { status: { not: 'CANCELLED' } } } } },
      },
      orderBy: { tableNumber: 'asc' },
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error('Tables GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'BILLING')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { tableNumber, status } = body;
    if (!tableNumber) return NextResponse.json({ error: 'Table number is required' }, { status: 400 });

    const existing = await prisma.restaurantTable.findUnique({ where: { tableNumber: Number(tableNumber) } });
    if (existing) {
      return NextResponse.json({ error: 'Table number already exists' }, { status: 409 });
    }

    const table = await prisma.restaurantTable.create({
      data: {
        tableNumber: Number(tableNumber),
        status: status || 'AVAILABLE',
      },
    });

    await activityLog(session.user.id, 'CREATE', 'RestaurantTable', table.id, { tableNumber: Number(tableNumber) });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error('Table POST error:', error);
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
  }
}
