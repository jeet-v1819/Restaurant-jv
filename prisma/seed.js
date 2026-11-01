import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@restaurant.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminName = process.env.ADMIN_NAME || 'Admin';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Admin user already exists: ${adminEmail}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const user = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  await prisma.restaurantSettings.create({
    data: {
      restaurantName: 'JV Restaurant',
      contactPhone: '+91 98765 43210',
      contactEmail: adminEmail,
      address: '123 Main Street, Rajkot, Gujarat, India',
      openingHours: 'Mon - Sun: 11:00 AM - 11:00 PM',
      isOpen: true,
      gstPercentage: 5,
      currency: 'INR',
    },
  });

  console.log(`Admin account created:
  Email: ${adminEmail}
  Password: ${adminPassword}
  Role: ADMIN
  Please change the password after first login.
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
