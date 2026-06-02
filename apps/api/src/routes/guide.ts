import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';

const PLANET_FACTS: Record<string, { overview: string; atmosphere: string; gravity: string; life: string }> = {
  sun: {
    overview: "The Sun's core temperature is 15 million Kelvin, generating energy via proton-proton chain thermonuclear fusion. Caution is advised: thermal radiation shields must be active.",
    atmosphere: "Atmosphere consists primarily of hydrogen (73%) and helium (25%) in a highly ionized plasma state, forming the photosphere, chromosphere, and corona.",
    gravity: "Surface gravity is approximately 274 m/s², about 28 times Earth's gravity. Any nearby spacecraft must maintain escape velocity.",
    life: "Extremely hostile to organic chemistry. Any biosignature detection is physically impossible in this radiation-dominated plasma field."
  },
  mercury: {
    overview: "Mercury experiences extreme temperature deltas ranging from -180°C at night to 430°C in the day. Magnetometer scans indicate a surprisingly strong iron core beneath its highly cratered crust.",
    atmosphere: "Mercury has a tenuous surface-bound exosphere composed of oxygen, sodium, hydrogen, and helium, constantly stripped by solar winds.",
    gravity: "Surface gravity is 3.7 m/s², roughly 38% of Earth's gravity. Low mass prevents the retention of a permanent atmosphere.",
    life: "No liquid water or atmosphere exists. Radiation and thermal shifts make Mercury an unlikely candidate for past or present habitability."
  },
  venus: {
    overview: "Venus has a surface pressure 92 times that of Earth and temperatures hot enough to melt lead. Super-rotation wind speeds exceed 360 km/h in the upper cloud deck.",
    atmosphere: "Atmosphere is extremely thick and dense, composed of 96.5% carbon dioxide with thick clouds of sulfuric acid vapor trapping solar heat.",
    gravity: "Surface gravity is 8.87 m/s² (0.9g). Structurally, Venus is Earth's sister planet, but its extreme runaway greenhouse effect diverged it.",
    life: "Surface conditions are lethal. However, atmospheric research suggests potential microbial biosignatures (like phosphine) could exist in milder clouds at 50km altitude."
  },
  earth: {
    overview: "Orbital telemetry confirms optimal magnetosphere protection. Nitrogen-oxygen atmosphere shielding is stable, supporting millions of taxonomic species. We are currently flying over the blue cradle of humanity.",
    atmosphere: "Atmosphere is composed of 78% nitrogen, 21% oxygen, and trace gases, creating the ideal pressure and temperature for liquid water stability.",
    gravity: "Standard surface gravity of 9.81 m/s² (1.0g). Our primary benchmark for planetary mass calculations and biological structural tolerance.",
    life: "Biospheric indexes are off the charts. High liquid water density, biological energy cycles, and industrial radio wave leakage detected."
  },
  mars: {
    overview: "Scanning the red surface. Iron oxide dust dominates the regolith. Atmospheric density is 1% of Earth's, primarily carbon dioxide. Water ice reservoirs detected beneath the polar caps.",
    atmosphere: "Thin atmosphere composed of 95% carbon dioxide. It offers minimal shielding from cosmic radiation and solar winds, leading to high water loss over epochs.",
    gravity: "Surface gravity is 3.72 m/s² (0.38g). Lower gravity allows dust storms to grow globally and persist for months.",
    life: "Intense search for paleolife is underway in ancient lake beds (like Jezero crater). Subsurface aquifers could theoretically shelter extremophile microbes."
  },
  jupiter: {
    overview: "The gas giant's magnetosphere is massive, generating severe radiation belts. The Great Red Spot is a persistent anticyclonic storm larger than Earth. Wind speeds in the zones exceed 600 km/h.",
    atmosphere: "Composed mostly of hydrogen and helium, matching the primordial solar nebula. Marked by complex bands of ammonia crystals and ammonium hydrosulfide clouds.",
    gravity: "Gravity at the cloud tops is 24.79 m/s² (2.5g). The immense pressure compresses hydrogen into a metallic liquid state deeper down.",
    life: "No solid surface exists. High pressure and radiation rule out life, though its icy moon Europa hides a vast liquid ocean with high astrobiological interest."
  },
  saturn: {
    overview: "Scanning the ring structures, composed of 99% pure water ice particles mixed with rocky dust. The planet has a density less than water. Enceladus and Titan orbit nearby.",
    atmosphere: "Deep hydrogen-helium atmosphere with trace methane and ammonia. Lacks Jupiter's sharp cloud banding but experiences seasonal mega-storms.",
    gravity: "Surface gravity at cloud tops is 10.44 m/s² (1.06g), surprisingly close to Earth's despite Saturn's massive volume.",
    life: "Saturn itself is uninhabitable, but its moons Titan (methane seas, organic chemistry) and Enceladus (hydrothermal vents spraying water plumes) are key search targets."
  },
  uranus: {
    overview: "The ice giant is tilted at an extreme 98-degree axis, likely due to a primordial collision. Methane gas absorbs red light, giving the atmosphere its pale cyan glow.",
    atmosphere: "Atmosphere contains hydrogen, helium, and a high concentration of water, ammonia, and methane ices. Winds reach speeds of 900 km/h.",
    gravity: "Gravity is 8.69 m/s² (0.88g). The planet's magnetic field is unusual, tilted and offset from its rotational center.",
    life: "Extreme cold, lack of solid surface, and high pressure make it highly hostile to biochemistry. Astrobiological potential is extremely low."
  },
  neptune: {
    overview: "Orbiting the outer boundary of the solar system. Neptune has the fastest winds in the solar system, peaking at 2,100 km/h. Its blue hue comes from atmospheric methane.",
    atmosphere: "Similar to Uranus, composed of hydrogen, helium, and methane, but with more active weather systems, including dark storms driven by internal heating.",
    gravity: "Gravity is 11.15 m/s² (1.14g), the second highest in the solar system, driven by its high density relative to Uranus.",
    life: "Vast icy mantle under extreme pressures. Surface conditions are uninhabitable. Astrobiology is focused primarily on its retrograde moon Triton."
  },
  moon: {
    overview: "Earth's tidal anchor is heavily cratered. Regolith analysis shows abundant helium-3 and water ice inside permanently shadowed craters. Gravity is 1/6th Earth normal.",
    atmosphere: "Exremely thin, vacuum-like exosphere of helium, neon, and hydrogen, offering no protection from meteoroids or solar particles.",
    gravity: "Surface gravity is 1.62 m/s² (0.16g), reducing muscular structural requirements and facilitating spacecraft launches.",
    life: "Completely sterile surface. Deep water ice in polar craters could support future human habitats, but no indigenous biosignatures exist."
  }
};

export default async function guideRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/guide',
    {
      schema: {
        description: 'AI Spacecraft Guide chat proxy endpoint',
        body: Type.Object({
          message: Type.String(),
          planetId: Type.String(),
        }),
        response: {
          200: {
            description: 'Server-Sent Events streaming response text chunk-by-chunk',
            type: 'string'
          }
        }
      },
    },
    async (request, reply) => {
      const { message, planetId } = request.body as { message: string; planetId: string };
      const normalizedPlanetId = planetId.toLowerCase();

      // Set headers for SSE stream
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      // Get target planet details or fallback to Earth
      const facts = PLANET_FACTS[normalizedPlanetId] || PLANET_FACTS.earth;
      
      // Analyze user input for topics
      const msgLower = message.toLowerCase();
      let responseBody = facts.overview;

      if (msgLower.includes('atmosphere') || msgLower.includes('air') || msgLower.includes('weather') || msgLower.includes('wind')) {
        responseBody = facts.atmosphere;
      } else if (msgLower.includes('gravity') || msgLower.includes('mass') || msgLower.includes('heavy') || msgLower.includes('weight')) {
        responseBody = facts.gravity;
      } else if (msgLower.includes('life') || msgLower.includes('alien') || msgLower.includes('live') || msgLower.includes('water') || msgLower.includes('inhabit')) {
        responseBody = facts.life;
      }

      const greeting = `[NOVA V1.2 TRANSMISSION INITIATED]\nOrbiting: ${normalizedPlanetId.toUpperCase()}.\n`;
      const closing = `\nTelemetry scans completed. Standing by. [NOVA OUT]`;

      const fullResponse = `${greeting}${responseBody}${closing}`;
      const words = fullResponse.split(' ');

      let index = 0;
      const interval = setInterval(() => {
        if (index < words.length) {
          const chunk = words[index] + ' ';
          reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
          index++;
        } else {
          clearInterval(interval);
          reply.raw.write('event: end\ndata: [DONE]\n\n');
          reply.raw.end();
        }
      }, 70); // 70ms per word creates an aesthetic typewriter stream

      // Handle client close
      request.raw.on('close', () => {
        clearInterval(interval);
      });
    }
  );
}
