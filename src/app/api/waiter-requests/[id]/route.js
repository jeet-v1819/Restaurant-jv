import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { emitWaiterResolved } from '@/lib/bus';
import { activityLog } from '@/lib/activity-log';

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'BILLING' && role !== 'CHEF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const request = await prisma.waiterRequest.findUnique({ where: { id } });
    if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    const updated = await prisma.waiterRequest.update({
      where: { id },
      data: { status, resolvedAt: status === 'RESOLVED' ? new Date() : null },
      include: { table: { select: { tableNumber: true } } },
    });

    emitWaiterResolved({
      requestId: updated.id,
      tableNumber: updated.table.tableNumber,
      status: updated.status,
    });

    if (session) {
      await activityLog(session.user.id, 'UPDATE', 'WaiterRequest', id, { status });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Waiter request PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update waiter request' }, { status: 500 });
  }
}
