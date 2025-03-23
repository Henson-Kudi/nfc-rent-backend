import express, { Application } from 'express';
import cors, { CorsOptions } from 'cors';
import cookierParser from 'cookie-parser';
import envConf from './config/env.conf';
import logger from './common/utils/logger';
import globalErrorHandler from './common/middleware/globale-error-handler';
import { deviceDetailsMiddleware } from '@/common/middleware/device-details';
import appRouter from '@/common/request/routes';

const app: Application = express();

const PORT = envConf.PORT;

// Middleware
const corsOptions: CorsOptions = {
  // Allow all origins for now
  origin: (origin, callback) => {
    callback(null, origin);
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json())

app.use(express.urlencoded({ extended: true }));
// Cookie parser
app.use(cookierParser());

// Use morgan for logging in development mode
if (envConf.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  app.use(require('morgan')('dev'));
}

// All requests are required to pass device details headers
app.use(deviceDetailsMiddleware); //Register all other routes below this middleware. If you dont want a route to require device details (not recommended), register the router above this middleware

// Register all routes here
app.use('/api/v1', appRouter);

// Custom 404 handler
app.use((_, res) => {
  res.status(404).json({
    success: false,
    message: "Resource not found",
  });
});

// Global error handler
app.use(globalErrorHandler);

// Start server
const startServer = () => {
  const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Press CTRL+C to stop server`);
    logger.info(`http://localhost:${PORT}`);
  });

  return {
    app,
    server,
  };
};

export default startServer;
