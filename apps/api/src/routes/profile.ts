import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { authenticate } from '../middleware/auth.js';
import { query } from '../db/client.js';

interface SaveProfileBody {
  username: string;
  avatar: string;
  xp: number;
  level: number;
  rank: string;
  achievements: string[];
}

export default async function profileRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/profile - Returns user telemetry and unlocked achievements
  fastify.get(
    '/profile',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Get logged-in user profile and achievements',
        response: {
          200: Type.Object({
            profile: Type.Object({
              id: Type.String(),
              username: Type.String(),
              avatar: Type.String(),
              xp: Type.Number(),
              level: Type.Number(),
              rank: Type.String(),
              created_at: Type.String(),
            }),
            achievements: Type.Array(Type.Object({
              achievement_id: Type.String(),
              unlocked_at: Type.String(),
            })),
          }),
          500: Type.Object({
            error: Type.String(),
            message: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.userId!;

      try {
        // 1. Fetch user profile
        const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
        
        let profile;
        
        if (userRes.rows.length === 0) {
          // New user sign-in: auto-initialize in the database!
          const defaultUser = {
            id: userId,
            username: 'Explorer One',
            avatar: '🚀',
            xp: 0,
            level: 1,
            rank: 'Flight Cadet',
          };
          
          await query(
            'INSERT INTO users (id, username, avatar, xp, level, rank) VALUES ($1, $2, $3, $4, $5, $6)',
            [defaultUser.id, defaultUser.username, defaultUser.avatar, defaultUser.xp, defaultUser.level, defaultUser.rank]
          );

          profile = {
            ...defaultUser,
            created_at: new Date().toISOString(),
          };
        } else {
          const row = userRes.rows[0];
          profile = {
            id: row.id,
            username: row.username,
            avatar: row.avatar || '🚀',
            xp: Number(row.xp),
            level: Number(row.level),
            rank: row.rank,
            created_at: new Date(row.created_at).toISOString(),
          };
        }

        // 2. Fetch achievements
        const achRes = await query('SELECT * FROM achievements WHERE user_id = $1', [userId]);
        const achievements = achRes.rows.map((r: { achievement_id: string; unlocked_at: string | Date }) => ({
          achievement_id: r.achievement_id,
          unlocked_at: new Date(r.unlocked_at).toISOString(),
        }));

        return {
          profile,
          achievements,
        };
      } catch (err) {
        fastify.log.error(err);
        reply.status(500).send({ error: 'DatabaseError', message: 'Failed to retrieve profile data.' });
      }
    }
  );

  // POST /api/profile - Saves user telemetry and adds unlocked achievements
  fastify.post(
    '/profile',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Save user profile telemetry and log unlocked achievements',
        body: Type.Object({
          username: Type.String(),
          avatar: Type.String(),
          xp: Type.Number(),
          level: Type.Number(),
          rank: Type.String(),
          achievements: Type.Array(Type.String()),
        }),
        response: {
          200: Type.Object({
            status: Type.String(),
          }),
          500: Type.Object({
            error: Type.String(),
            message: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = request.userId!;
      const { username, avatar, xp, level, rank, achievements } = request.body as SaveProfileBody;

      try {
        // 1. Upsert profile
        await query(
          'INSERT INTO users (id, username, avatar, xp, level, rank) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET username = $2, avatar = $3, xp = $4, level = $5, rank = $6',
          [userId, username, avatar, xp, level, rank]
        );

        // 2. Insert new achievements
        for (const achId of achievements) {
          await query(
            'INSERT INTO achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT (user_id, achievement_id) DO NOTHING',
            [userId, achId]
          );
        }

        return { status: 'success' };
      } catch (err) {
        fastify.log.error(err);
        reply.status(500).send({ error: 'DatabaseError', message: 'Failed to save profile data.' });
      }
    }
  );
}
