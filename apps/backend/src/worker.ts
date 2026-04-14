import { connectDB, logger } from '@neurovault/shared';
import { documentWorker } from './workers/documentWorker';

async function startWorker() {
  try {
    logger.info('Starting Document Processing Worker...');
    await connectDB();
    
    // The worker is started automatically when imported
    logger.info(`Worker is now listening for jobs...`);

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('Gracefully shutting down worker...');
      await documentWorker.close();
      process.exit(0);
    });

  } catch (err) {
    logger.error('Worker failed to start:', err);
    process.exit(1);
  }
}

startWorker();
