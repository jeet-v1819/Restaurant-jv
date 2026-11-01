import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const table = await prisma.restaurantTable.findUnique({ where: { id } });
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    const base = process.env.QR_CODE_BASE_URL || 'http://localhost:3000/table';
    const qrUrl = `${base}/${table.tableNumber}`;

    return NextResponse.json({
      tableNumber: table.tableNumber,
      qrUrl,
      qrData: JSON.stringify({ type: 'table', tableNumber: table.tableNumber }),
    });
  } catch (error) {
    console.error('QR GET error:', error);
    return NextResponse.json({ error: 'Failed to generate QR data' }, { status: 500 });
  }
}
