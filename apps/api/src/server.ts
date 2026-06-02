import Fastify, { FastifyError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { Type } from '@sinclair/typebox';

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
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // Secure HTTP headers with Helmet (disable CSP in dev to avoid asset loads block)
  await fastify.register(helmet, {
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
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
    reply.status(error.statusCode || 500).send({
      error: error.name,
      message: error.message,
      statusCode: error.statusCode || 500,
    });
  });
};

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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
