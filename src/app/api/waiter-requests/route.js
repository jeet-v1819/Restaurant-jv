import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { emitWaiterRequest } from '@/lib/bus';
import { activityLog } from '@/lib/activity-log';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'BILLING' && role !== 'CHEF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requests = await prisma.waiterRequest.findMany({
      include: {
        table: { select: { tableNumber: true } },
        order: { select: { orderNumber: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Waiter requests GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch waiter requests' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { tableId, orderId } = body;
    if (!tableId) return NextResponse.json({ error: 'Table id is required' }, { status: 400 });

    // Prevent duplicate pending requests for the same table
    const existing = await prisma.waiterRequest.findFirst({
      where: { tableId, status: 'PENDING' },
    });
    if (existing) {
      return NextResponse.json({ error: 'A waiter request is already pending for this table' }, { status: 409 });
    }

    const request = await prisma.waiterRequest.create({
      data: { tableId, orderId: orderId || null },
      include: { table: { select: { tableNumber: true } } },
    });

    emitWaiterRequest({
      requestId: request.id,
      tableNumber: request.table.tableNumber,
      status: request.status,
      createdAt: request.createdAt,
    });

    if (session) {
      await activityLog(session.user.id, 'CREATE', 'WaiterRequest', request.id, { tableId, orderId });
    }

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error('Waiter request POST error:', error);
    return NextResponse.json({ error: 'Failed to create waiter request' }, { status: 500 });
  }
}
