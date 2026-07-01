import app from './app.js';
import { config } from './config/index.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

const server = app.listen(config.server.port, () => {
  logger.info(`🚀 Server running in [${config.server.env}] mode on port: ${config.server.port}`);
  logger.info(`🔗 API Endpoint: http://localhost:${config.server.port}/api/v1`);
});

// Implement Graceful Shutdown routines to clean up db connections
const shutdown = async (signal: string) => {
  logger.warn(`Received ${signal} signal. Beginning graceful shutdown process...`);

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await prisma.$disconnect();
      logger.info('Database client disconnected successfully.');
      process.exit(0);
    } catch (err) {
      logger.error('Error encountered during database disconnection:', err);
      process.exit(1);
    }
  });

  // Timeout handler to force close server connections after 10s
  setTimeout(() => {
    logger.error('Force shutdown triggered due to process timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Promise Rejection caught at root level:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception caught at root level:', error);
  process.exit(1);
});
