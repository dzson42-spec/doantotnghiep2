import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app = express();
const allowedOrigins = [process.env.CLIENT_URL, process.env.ADMIN_URL].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  // Cho phép tất cả localhost và 127.0.0.1 với mọi port trong môi trường dev
  if (process.env.NODE_ENV !== 'production') {
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return true;
    }
  }
  return allowedOrigins.includes(origin);
};

app.set('logger', logger);
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), authRoutes);
app.use('/api', catalogRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', service: 'cinevite-server' } });
});

app.use(notFound);
app.use(errorHandler);

export { logger };
export default app;
