import Fastify, { FastifyError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { Type } from '@sinclair/typebox';
import { validateEnv, getEnv } from './config/env.js';
import guideRoutes from './routes/guide.js';
import missionRoutes from './routes/missions.js';
import * as Sentry from '@sentry/node';

// Validate environment variables on startup
const env = validateEnv();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
  console.log('[Sentry] API Node SDK Initialized.');
}

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
});

// Configure plugins asynchronously
const bootstrap = async () => {
  // CORS configuration
  const allowedOrigins: (string | RegExp)[] = [];
  if (env.NODE_ENV === 'production') {
    if (env.ALLOWED_ORIGINS) {
      allowedOrigins.push(...env.ALLOWED_ORIGINS.split(',').map(o => o.trim()));
    } else {
      allowedOrigins.push(
        'https://orbital-insight.com',
        'https://staging.orbital-insight.com',
        /\.orbital-insight\.com$/
      );
    }
  } else {
    // In dev, allow localhost development servers
    allowedOrigins.push(
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000'
    );
  }

  await fastify.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  });

  // Secure HTTP headers with Helmet (disable CSP in dev to avoid asset loads block)
  await fastify.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  // General Rate Limiting: 100 requests per minute per IP
  await fastify.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
  });

  // Swagger Documentation Setup
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Orbital Insight API',
        description: 'Cinematic Space Exploration Engine Backend API',
        version: '0.1.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development Server',
        },
      ],
    },
  });

  // Serve Swagger docs UI (development only)
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Register guide proxy routes
  await fastify.register(guideRoutes, { prefix: '/api' });
  await fastify.register(missionRoutes, { prefix: '/api' });

  // Health endpoint with TypeBox Schema Validation
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Get server health status',
        response: {
          200: Type.Object({
            status: Type.String(),
            uptime: Type.Number(),
            version: Type.String(),
          }),
        },
      },
    },
    async () => {
      return {
        status: 'ok',
        uptime: process.uptime(),
        version: '0.1.0',
      };
    }
  );

  // Fallback Error Handler
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    fastify.log.error(error);
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }
    reply.status(error.statusCode || 500).send({
      error: error.name,
      message: error.message,
      statusCode: error.statusCode || 500,
    });
  });
};

const PORT = getEnv().PORT;

const start = async () => {
  try {
    await bootstrap();
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`[Server] Running successfully at http://localhost:${PORT}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

start();
