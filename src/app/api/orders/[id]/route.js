import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { emitOrderUpdated } from '@/lib/bus';
import { activityLog } from '@/lib/activity-log';

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const role = session.user.role;
    const userId = session.user.id;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payment: true,
        table: true,
        customer: { include: { user: true } },
        user: { select: { name: true, email: true, role: true } },
      },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (role === 'CUSTOMER' && order.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Order detail GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'CHEF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, estimatedPrepTime } = body;

    const order = await prisma.order.findUnique({ where: { id }, include: { table: true } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const data = {};
    if (status) data.status = status;
    if (estimatedPrepTime !== undefined) data.estimatedPrepTime = Number(estimatedPrepTime) || null;

    const updated = await prisma.order.update({ where: { id }, data, include: { items: true, table: true } });

    emitOrderUpdated({
      order: updated,
      tableNumber: order.table.tableNumber,
    });

    await activityLog(session.user.id, 'UPDATE', 'Order', id, data);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Order PUT error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
