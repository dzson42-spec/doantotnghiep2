import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import { connectDatabase } from './config/database.js';

const seed = async () => {
  await connectDatabase();

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@cinevite.local';
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    throw new Error('SEED_ADMIN_PASSWORD must be configured before running the seed');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`User already exists: ${email}`);
    return;
  }

  await User.create({
    name: 'CineVite Super Admin',
    email,
    passwordHash: password,
    role: 'superadmin'
  });

  console.log(`Created superadmin: ${email}`);
};

seed()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

