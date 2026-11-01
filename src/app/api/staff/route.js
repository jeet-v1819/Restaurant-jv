import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { activityLog } from '@/lib/activity-log';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const staff = await prisma.staff.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } },
        _count: { select: { orders: true, payments: true } },
      },
      orderBy: { user: { createdAt: 'asc' } },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Staff GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role, phone, address, employeeId } = body;
    if (!name || !email || !password || !role || !employeeId) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (role !== 'CHEF' && role !== 'BILLING') {
      return NextResponse.json({ error: 'Role must be CHEF or BILLING' }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const existingEmployee = await prisma.staff.findUnique({ where: { employeeId } });
    if (existingEmployee) {
      return NextResponse.json({ error: 'Employee ID already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone: phone || null,
        address: address || null,
        isActive: true,
      },
    });

    const staff = await prisma.staff.create({
      data: {
        userId: user.id,
        employeeId,
      },
    });

    await activityLog(session.user.id, 'CREATE', 'Staff', staff.id, {
      name,
      email,
      role,
      employeeId,
    });

    return NextResponse.json({ user: { id: user.id, name, email, role }, staff }, { status: 201 });
  } catch (error) {
    console.error('Staff POST error:', error);
    return NextResponse.json({ error: 'Failed to create staff account' }, { status: 500 });
  }
}
