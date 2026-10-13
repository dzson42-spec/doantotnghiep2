import 'dotenv/config';
import app, { logger } from './app.js';
import { connectDatabase } from './config/database.js';
import cron from 'node-cron';
import { expireHeldBookings } from './services/booking.service.js';

const port = Number(process.env.PORT || 5000);

const startServer = async () => {
  await connectDatabase();
  cron.schedule('* * * * *', () => {
    expireHeldBookings().catch((error) => logger.error(error.stack || error.message));
  });
  app.listen(port, () => {
    logger.info(`CineVite server listening on port ${port}`);
  });
};

startServer().catch((error) => {
  logger.error(error.stack || error.message);
  process.exitCode = 1;
});
