import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { activityLog } from '@/lib/activity-log';

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'BILLING')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const table = await prisma.restaurantTable.findUnique({ where: { id } });
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    const body = await req.json();
    const { tableNumber, status, isActive } = body;
    const data = {};
    if (tableNumber !== undefined) {
      const existing = await prisma.restaurantTable.findUnique({
        where: { tableNumber: Number(tableNumber) },
      });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'Table number already exists' }, { status: 409 });
      }
      data.tableNumber = Number(tableNumber);
    }
    if (status !== undefined) data.status = status;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await prisma.restaurantTable.update({ where: { id }, data });

    await activityLog(session.user.id, 'UPDATE', 'RestaurantTable', id, data);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Table PUT error:', error);
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const table = await prisma.restaurantTable.findUnique({ where: { id } });
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    await prisma.restaurantTable.delete({ where: { id } });

    await activityLog(session.user.id, 'DELETE', 'RestaurantTable', id, { tableNumber: table.tableNumber });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Table DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 });
  }
}
