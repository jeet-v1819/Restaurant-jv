import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { emitOrderCreated, emitOrderUpdated } from '@/lib/bus';
import { activityLog } from '@/lib/activity-log';

function generateOrderNumber() {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`;
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = session.user.role;
    const userId = session.user.id;
    const status = searchParams.get('status');
    const tableId = searchParams.get('tableId');
    const tableNumber = searchParams.get('tableNumber');
    const sessionId = searchParams.get('sessionId');
    const customerId = searchParams.get('customerId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const take = Number(searchParams.get('take') || '50');

    const where = {};

    // Role-based scope
    if (role === 'CUSTOMER') {
      where.userId = userId;
    }

    if (status) where.status = status;
    if (tableId) where.tableId = tableId;
    if (sessionId) where.sessionId = sessionId;
    if (customerId && role === 'ADMIN') where.customerId = customerId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    if (tableNumber) {
      const table = await prisma.restaurantTable.findUnique({
        where: { tableNumber: Number(tableNumber) },
      });
      if (table) where.tableId = table.id;
      else where.tableId = 'nonexistent';
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        payment: true,
        table: { select: { tableNumber: true, status: true } },
        customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { tableNumber, items, specialInstructions, guestName, guestPhone } = body;

    if (!tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Table number and items are required' }, { status: 400 });
    }

    // Prevent duplicate submission handled by frontend unique key; here we rely on transaction.

    const settings = await prisma.restaurantSettings.findFirst();
    const gstPercentage = settings?.gstPercentage || 5;

    if (settings?.isOpen === false) {
      return NextResponse.json({ error: 'Restaurant is currently closed' }, { status: 400 });
    }

    // Find table
    const table = await prisma.restaurantTable.findUnique({
      where: { tableNumber: Number(tableNumber) },
    });
    if (!table || !table.isActive) {
      return NextResponse.json({ error: 'Invalid table number' }, { status: 400 });
    }

    // Find or create active session for this table
    let tableSession = await prisma.tableSession.findFirst({
      where: { tableId: table.id, status: 'ACTIVE' },
    });

    let customerId = null;
    let userId = null;
    if (session) {
      userId = session.user.id;
      if (session.user.role === 'CUSTOMER') {
        const customer = await prisma.customer.findUnique({ where: { userId } });
        if (customer) customerId = customer.id;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      if (!tableSession) {
        tableSession = await tx.tableSession.create({
          data: {
            tableId: table.id,
            status: 'ACTIVE',
            openedById: userId || null,
          },
        });

        await tx.restaurantTable.update({
          where: { id: table.id },
          data: { status: 'OCCUPIED' },
        });
      }

      // Validate items and snapshot prices from DB (authoritative)
      const orderItems = [];
      let subtotal = 0;

      for (const item of items) {
        let foodName = item.foodName;
        let foodPrice = Number(item.foodPrice);
        let foodItemId = item.foodItemId || null;

        if (foodItemId) {
          const food = await tx.foodItem.findUnique({ where: { id: foodItemId } });
          if (!food) throw new Error(`Food item not found: ${item.foodName || foodItemId}`);
          if (!food.isAvailable) throw new Error(`${food.name} is not available`);
          foodName = food.name;
          foodPrice = food.price;
        } else if (!foodName || !foodPrice) {
          throw new Error('Invalid order item');
        }

        const quantity = Math.max(1, Number(item.quantity) || 1);
        const totalPrice = foodPrice * quantity;
        subtotal += totalPrice;

        orderItems.push({
          foodName,
          foodPrice,
          quantity,
          totalPrice,
          foodItemId,
          specialInstructions: item.specialInstructions || null,
        });
      }

      const taxAmount = (subtotal * gstPercentage) / 100;
      const totalAmount = subtotal + taxAmount;

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          tableId: table.id,
          sessionId: tableSession.id,
          userId,
          customerId,
          guestName: guestName || null,
          guestPhone: guestPhone || null,
          status: 'PENDING',
          specialInstructions: specialInstructions || null,
          subtotal,
          taxAmount,
          totalAmount,
          items: {
            create: orderItems,
          },
        },
        include: { items: true },
      });

      // Link session to payment later; nothing here

      return order;
    });

    const orderWithRelations = await prisma.order.findUnique({
      where: { id: result.id },
      include: { items: true, table: { select: { tableNumber: true } } },
    });

    emitOrderCreated({
      order: orderWithRelations,
      tableNumber: table.tableNumber,
      sessionId: tableSession.id,
    });

    await activityLog(session?.user?.id, 'CREATE', 'Order', result.id, {
      orderNumber: result.orderNumber,
      tableNumber: table.tableNumber,
      totalAmount: result.totalAmount,
    });

    return NextResponse.json(orderWithRelations, { status: 201 });
  } catch (error) {
    console.error('Order POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
