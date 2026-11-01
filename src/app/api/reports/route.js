import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'daily'; // daily | weekly | monthly

    const now = new Date();
    let from = new Date(now);
    if (range === 'weekly') from.setDate(now.getDate() - 7);
    else if (range === 'monthly') from.setMonth(now.getMonth() - 1);
    else from.setDate(now.getDate() - 1);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from } },
      include: { items: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'READY').length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;
    const paidOrders = orders.filter((o) => o.payment && o.payment.status === 'PAID');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalGST = paidOrders.reduce((sum, o) => sum + Number(o.payment?.gstAmount || 0), 0);

    // Popular items
    const itemMap = {};
    for (const o of orders) {
      for (const i of o.items) {
        if (!itemMap[i.foodName]) {
          itemMap[i.foodName] = { name: i.foodName, quantity: 0, revenue: 0 };
        }
        itemMap[i.foodName].quantity += i.quantity;
        itemMap[i.foodName].revenue += Number(i.totalPrice);
      }
    }
    const popular = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity).slice(10);

    // Payment report
    const paymentReport = orders.map((o) => ({
      orderNumber: o.orderNumber,
      tableNumber: o.table?.tableNumber,
      status: o.status,
      payment: o.payment?.status || 'UNPAID',
      total: o.totalAmount,
      gst: o.payment?.gstAmount || 0,
      createdAt: o.createdAt,
      paidBy: o.payment?.paidBy?.name || null,
    }));

    return NextResponse.json({
      range,
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      totalGST,
      popular,
      paymentReport,
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
