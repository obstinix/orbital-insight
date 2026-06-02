import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';

export default async function missionRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/missions/iss',
    {
      schema: {
        description: 'Get real-time ISS telemetry coordinates from Open Notify or fallback',
        response: {
          200: Type.Object({
            timestamp: Type.Number(),
            latitude: Type.Number(),
            longitude: Type.Number(),
            isSimulated: Type.Boolean(),
          }),
        },
      },
    },
    async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout limit

        const response = await fetch('http://api.open-notify.org/iss-now.json', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('ISS API response failure');
        }

        const data = (await response.json()) as any;
        if (data && data.iss_position) {
          return {
            timestamp: data.timestamp || Math.floor(Date.now() / 1000),
            latitude: parseFloat(data.iss_position.latitude),
            longitude: parseFloat(data.iss_position.longitude),
            isSimulated: false,
          };
        }
        throw new Error('Payload format mismatch');
      } catch (err) {
        // Fallback: Orbit calculation (92 minute orbital period, 51.64° inclination)
        const totalPeriodSeconds = 5520;
        const seconds = Math.floor(Date.now() / 1000) % totalPeriodSeconds;
        const angle = (seconds / totalPeriodSeconds) * 2 * Math.PI;

        const lat = Math.sin(angle) * 51.64;
        const lon = ((angle * (180 / Math.PI)) % 360) - 180;

        return {
          timestamp: Math.floor(Date.now() / 1000),
          latitude: lat,
          longitude: lon,
          isSimulated: true,
        };
      }
    }
  );
}
