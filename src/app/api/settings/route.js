import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { activityLog } from '@/lib/activity-log';

export async function GET() {
  try {
    const settings = await prisma.restaurantSettings.findFirst();
    return NextResponse.json(settings || {});
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      restaurantName,
      restaurantLogo,
      contactPhone,
      contactEmail,
      address,
      openingHours,
      isOpen,
      gstPercentage,
      currency,
    } = body;

    const existing = await prisma.restaurantSettings.findFirst();

    const settings = existing
      ? await prisma.restaurantSettings.update({
          where: { id: existing.id },
          data: {
            restaurantName,
            restaurantLogo,
            contactPhone,
            contactEmail,
            address,
            openingHours,
            isOpen,
            gstPercentage: gstPercentage !== undefined ? Number(gstPercentage) : undefined,
            currency,
          },
        })
      : await prisma.restaurantSettings.create({
          data: {
            restaurantName,
            restaurantLogo,
            contactPhone,
            contactEmail,
            address,
            openingHours,
            isOpen,
            gstPercentage: gstPercentage !== undefined ? Number(gstPercentage) : 5,
            currency: currency || 'INR',
          },
        });

    await activityLog(session.user.id, 'UPDATE', 'RestaurantSettings', settings.id, {
      restaurantName,
      gstPercentage,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
