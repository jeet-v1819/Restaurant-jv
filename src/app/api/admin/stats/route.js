import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      todayRevenue,
      totalRevenue,
      availableTables,
      occupiedTables,
      popularFood,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'READY' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow }, payment: { status: 'PAID' } },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({ where: { payment: { status: 'PAID' } }, _sum: { totalAmount: true } }),
      prisma.restaurantTable.count({ where: { status: 'AVAILABLE', isActive: true } }),
      prisma.restaurantTable.count({ where: { status: 'OCCUPIED' } }),
      prisma.orderItem.groupBy({
        by: ['foodName'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 1,
      }),
    ]);

    return NextResponse.json({
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      todayRevenue: todayRevenue._sum.totalAmount || 0,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      availableTables,
      occupiedTables,
      mostPopularFood: popularFood[0] || null,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
