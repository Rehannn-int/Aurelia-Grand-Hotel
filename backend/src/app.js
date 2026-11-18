import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import ApiError from './utils/ApiError.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { webhook } from './controllers/paymentController.js';
import { publicHotelSettings } from './controllers/settingsController.js';

export function createApp(env) {
  const app = express();
  const prefix = env.API_PREFIX.replace(/\/+$/, '');
  app.locals.env = env;
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || [env.CLIENT_URL, env.ADMIN_CLIENT_URL].includes(origin)) return callback(null, true);
      return callback(new ApiError(403, 'Origin is not allowed by CORS'));
    },
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'Stripe-Signature'],
  }));
  app.use(`${prefix}/payments/webhook`, express.raw({ type: 'application/json', limit: '256kb' }), webhook);
  app.use(express.json({ limit: '1mb', strict: true }));
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.path.endsWith('/health'),
  }));
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith(`${prefix}/auth`) || req.originalUrl.startsWith(`${prefix}/bookings`) || req.originalUrl.startsWith(`${prefix}/payments`)) {
      res.setHeader('Cache-Control', 'no-store');
    }
    next();
  });

  app.get(`${prefix}/health`, (req, res) => {
    const database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const healthy = database === 'connected';
    return res.status(healthy ? 200 : 503).json({
      success: healthy,
      message: healthy ? 'Service is healthy' : 'Required database is unavailable',
      data: {
        status: healthy ? 'healthy' : 'unhealthy',
        environment: env.NODE_ENV,
        database,
        uptimeSeconds: Math.floor(process.uptime()),
      },
    });
  });

  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/rooms`, roomRoutes);
  app.use(`${prefix}/bookings`, bookingRoutes);
  app.use(`${prefix}/payments`, paymentRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.get(`${prefix}/settings/public`, publicHotelSettings);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
