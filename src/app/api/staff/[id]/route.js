import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { activityLog } from '@/lib/activity-log';

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, email, role, employeeId, isActive, password } = body;

    const staff = await prisma.staff.findUnique({ where: { id }, include: { user: true } });
    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    const userData = {};
    if (name !== undefined) userData.name = name;
    if (email !== undefined) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== staff.userId) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }
      userData.email = email;
    }
    if (role !== undefined) userData.role = role;
    if (isActive !== undefined) userData.isActive = isActive;
    if (password) userData.password = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({ where: { id: staff.userId }, data: userData });

    const staffData = {};
    if (employeeId !== undefined) {
      const existing = await prisma.staff.findUnique({ where: { employeeId } });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'Employee ID already exists' }, { status: 409 });
      }
      staffData.employeeId = employeeId;
    }
    if (Object.keys(staffData).length > 0) {
      await prisma.staff.update({ where: { id }, data: staffData });
    }

    await activityLog(session.user.id, 'UPDATE', 'Staff', id, staffData);

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Staff PUT error:', error);
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: staff.userId } });

    await activityLog(session.user.id, 'DELETE', 'Staff', id, { employeeId: staff.employeeId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Staff DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
  }
}
