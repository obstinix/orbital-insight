import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { query } from '../db/client.js';

export default async function exoplanetRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/exoplanets - Returns paginated, searchable list of exoplanets
  fastify.get(
    '/exoplanets',
    {
      schema: {
        description: 'Get paginated, searchable list of exoplanets',
        querystring: Type.Object({
          search: Type.Optional(Type.String()),
          category: Type.Optional(Type.String()),
          limit: Type.Optional(Type.String()),
          offset: Type.Optional(Type.String()),
        }),
        response: {
          200: Type.Object({
            exoplanets: Type.Array(
              Type.Object({
                id: Type.String(),
                name: Type.String(),
                category: Type.String(),
                type: Type.String(),
                distance: Type.Number(),
                discoveryYear: Type.Number(),
                method: Type.String(),
                mass: Type.Number(),
                radius: Type.Number(),
                habitabilityScore: Type.Number(),
                temperature: Type.Number(),
                star: Type.String(),
                description: Type.String(),
              })
            ),
            total: Type.Number(),
          }),
          500: Type.Object({
            error: Type.String(),
            message: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const search = (request.query as any).search || '';
      const category = (request.query as any).category || 'ALL';
      const limit = parseInt((request.query as any).limit || '50', 10);
      const offset = parseInt((request.query as any).offset || '0', 10);

      try {
        // 1. Get total count matching criteria
        const countRes = await query(
          'SELECT COUNT(*) FROM exoplanets WHERE (name ILIKE $1 OR star ILIKE $1) AND ($2 = \'ALL\' OR category = $2)',
          [`%${search}%`, category]
        );
        const total = parseInt(countRes.rows[0]?.count || '0', 10);

        // 2. Fetch paginated records ordered by name
        const selectRes = await query(
          'SELECT * FROM exoplanets WHERE (name ILIKE $1 OR star ILIKE $1) AND ($2 = \'ALL\' OR category = $2) ORDER BY name ASC LIMIT $3 OFFSET $4',
          [`%${search}%`, category, limit, offset]
        );

        // 3. Map database columns to frontend camelCase keys
        const exoplanets = selectRes.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          type: row.type || '',
          distance: Number(row.distance ?? 0),
          discoveryYear: Number(row.discovery_year ?? 0),
          method: row.method || '',
          mass: Number(row.mass ?? 0),
          radius: Number(row.radius ?? 0),
          habitabilityScore: Number(row.habitability_score ?? 0),
          temperature: Number(row.temperature ?? 0),
          star: row.star || '',
          description: row.description || '',
        }));

        return {
          exoplanets,
          total,
        };
      } catch (err) {
        fastify.log.error(err);
        reply.status(500).send({ error: 'DatabaseError', message: 'Failed to retrieve exoplanets data.' });
      }
    }
  );

  // GET /api/exoplanets/:id - Returns details for a specific exoplanet by ID
  fastify.get(
    '/exoplanets/:id',
    {
      schema: {
        description: 'Get detailed info for a single exoplanet by ID',
        params: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: Type.Object({
            id: Type.String(),
            name: Type.String(),
            category: Type.String(),
            type: Type.String(),
            distance: Type.Number(),
            discoveryYear: Type.Number(),
            method: Type.String(),
            mass: Type.Number(),
            radius: Type.Number(),
            habitabilityScore: Type.Number(),
            temperature: Type.Number(),
            star: Type.String(),
            description: Type.String(),
          }),
          404: Type.Object({
            error: Type.String(),
            message: Type.String(),
          }),
          500: Type.Object({
            error: Type.String(),
            message: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const selectRes = await query('SELECT * FROM exoplanets WHERE id = $1', [id]);
        
        if (selectRes.rows.length === 0) {
          reply.status(404).send({ error: 'NotFound', message: `Exoplanet with ID '${id}' not found.` });
          return;
        }

        const row = selectRes.rows[0];
        return {
          id: row.id,
          name: row.name,
          category: row.category,
          type: row.type || '',
          distance: Number(row.distance ?? 0),
          discoveryYear: Number(row.discovery_year ?? 0),
          method: row.method || '',
          mass: Number(row.mass ?? 0),
          radius: Number(row.radius ?? 0),
          habitabilityScore: Number(row.habitability_score ?? 0),
          temperature: Number(row.temperature ?? 0),
          star: row.star || '',
          description: row.description || '',
        };
      } catch (err) {
        fastify.log.error(err);
        reply.status(500).send({ error: 'DatabaseError', message: 'Failed to retrieve exoplanet data.' });
      }
    }
  );
}
