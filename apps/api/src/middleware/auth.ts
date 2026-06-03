import { FastifyRequest, FastifyReply } from 'fastify';
import { createClerkClient } from '@clerk/backend';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

let clerkClient: ReturnType<typeof createClerkClient> | null = null;
const secretKey = process.env.CLERK_SECRET_KEY;

if (secretKey) {
  try {
    clerkClient = createClerkClient({ secretKey });
    console.log('[Auth] Clerk backend SDK client initialized.');
  } catch (err) {
    console.error('[Auth] Failed to initialize Clerk client:', err);
  }
} else {
  console.log('[Auth] CLERK_SECRET_KEY not configured. Running in Developer Mock Auth Mode.');
}

/**
 * Fastify preHandler hook that validates JWT tokens and populates request.userId.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Unauthorized', message: 'Missing or invalid Authorization header.' });
    return;
  }

  const token = authHeader.substring(7).trim();

  // Developer mock token fallback when Clerk is not initialized
  if (!clerkClient) {
    if (token.startsWith('dev-token-')) {
      request.userId = token;
      return;
    }
    // Accept standard default mock token
    request.userId = 'dev-token-user123';
    return;
  }

  try {
    const verified = await (clerkClient as unknown as { verifyToken: (token: string) => Promise<{ sub: string }> }).verifyToken(token);
    request.userId = verified.sub;
  } catch (err) {
    console.error('[Auth] JWT Verification failed:', err);
    
    // Developer fallback in development environment even with clerkClient active
    if (process.env.NODE_ENV !== 'production' && token.startsWith('dev-token-')) {
      request.userId = token;
      return;
    }

    const message = err instanceof Error ? err.message : String(err);
    reply.status(401).send({ error: 'Unauthorized', message: `Token verification failed: ${message}` });
  }
}
