import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { emitPaymentPaid, emitTableStatusChanged, emitSessionClosed } from '@/lib/bus';
import { activityLog } from '@/lib/activity-log';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = session.user.role;
    const { searchParams } = new URL(req.url);
    const tableNumber = searchParams.get('tableNumber');
    const status = searchParams.get('status');
    const sessionId = searchParams.get('sessionId');

    const where = {};
    if (status) where.status = status;
    if (sessionId) where.sessionId = sessionId;

    if (tableNumber) {
      const table = await prisma.restaurantTable.findUnique({
        where: { tableNumber: Number(tableNumber) },
      });
      if (!table) return NextResponse.json({ orders: [], total: 0, gst: 0, grandTotal: 0 });
      const session = await prisma.tableSession.findFirst({
        where: { tableId: table.id, status: 'ACTIVE' },
      });
      if (!session) return NextResponse.json({ orders: [], total: 0, gst: 0, grandTotal: 0 });
      where.sessionId = session.id;
    }

    // Role scoping: customers see nothing here (payments are staff-only domain)
    if (role !== 'ADMIN' && role !== 'BILLING') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: {
          include: {
            items: true,
            table: { select: { tableNumber: true } },
          },
        },
        paidBy: { select: { name: true, email: true, role: true } },
        session: { select: { id: true, status: true, tableId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const gst = payments.reduce((sum, p) => sum + Number(p.gstAmount), 0);

    return NextResponse.json({ payments, total, gst, grandTotal: total + gst });
  } catch (error) {
    console.error('Payments GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'BILLING') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId } = body;
    if (!orderId) return NextResponse.json({ error: 'Order id is required' }, { status: 400 });

    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { payment: true, session: true, table: true },
      });
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Prevent duplicate payment
      if (order.payment && order.payment.status === 'PAID') {
        return NextResponse.json({ error: 'Order is already paid' }, { status: 409 });
      }

      const gstPercentage = 5; // default; ideally from settings
      const settings = await tx.restaurantSettings.findFirst();
      const gstPct = settings?.gstPercentage || 5;
      const gstAmount = (Number(order.taxAmount) > 0 ? Number(order.taxAmount) : (Number(order.subtotal) * gstPct) / 100);

      const payment = await tx.payment.create({
        data: {
          orderId,
          sessionId: order.sessionId,
          amount: Number(order.totalAmount),
          gstAmount,
          method: 'CASH',
          status: 'PAID',
          paidAt: new Date(),
          paidById: session.user.id,
        },
      });

      // If all orders in this session are paid, close the session and free the table
      const sessionOrders = await tx.order.findMany({
        where: { sessionId: order.sessionId },
        include: { payment: true },
      });
      const allPaid = sessionOrders.length > 0 && sessionOrders.every((o) => o.payment && o.payment.status === 'PAID');

      if (allPaid) {
        await tx.tableSession.update({
          where: { id: order.sessionId },
          data: { status: 'CLOSED', closedAt: new Date() },
        });
        await tx.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });

        emitSessionClosed({
          sessionId: order.sessionId,
          tableNumber: order.table.tableNumber,
        });
        emitTableStatusChanged({
          tableId: order.tableId,
          tableNumber: order.table.tableNumber,
          status: 'AVAILABLE',
        });
      }

      emitPaymentPaid({
        paymentId: payment.id,
        orderId,
        orderNumber: order.orderNumber,
        tableNumber: order.table.tableNumber,
        amount: payment.amount,
        paidBy: session.user.name,
        paidAt: payment.paidAt,
      });

      await activityLog(session.user.id, 'PAYMENT', 'Payment', payment.id, {
        orderId,
        orderNumber: order.orderNumber,
        tableNumber: order.table.tableNumber,
        amount: payment.amount,
      });

      return NextResponse.json(payment, { status: 201 });
    });
  } catch (error) {
    console.error('Payment POST error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
