export interface GuideMessage {
  sender: 'user' | 'nova';
  text: string;
  timestamp: Date;
}

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'llama3.2';

const CANNED_RESPONSES: Record<string, string> = {
  default: "I'm your orbital guide. This is a fascinating object — its gravity, composition, and orbital mechanics make it unique in the cosmos. What would you like to explore next?",
  sun: "The Sun contains 99.86% of our solar system's mass. Its core temperature reaches 15 million°C where hydrogen fuses into helium, releasing the energy that powers all life on Earth.",
  mercury: "Mercury is the smallest planet and closest to the Sun. It experiences extreme temperature swings from blistering day heat to freezing nights, and is covered in craters like Earth's Moon.",
  venus: "Venus is our sister planet, but a runaway greenhouse effect makes it the hottest world in the solar system, with a crushing CO₂ atmosphere and yellow sulfuric acid clouds.",
  earth: "Earth is our home planet — the only place in the universe known to harbor life. Its liquid oceans, protective magnetosphere, and active plate tectonics sustain a vibrant biosphere.",
  moon: "The Moon is Earth's only natural satellite. It locks tidally with Earth, stabilizing our tilt, and preserves a record of early solar system impacts in its quiet, dusty basins.",
  mars: "Mars has the largest volcano in the solar system — Olympus Mons, 3× the height of Everest. Its thin CO₂ atmosphere and evidence of ancient rivers make it the prime candidate for past microbial life.",
  jupiter: "Jupiter's Great Red Spot is a storm larger than Earth that has raged for over 350 years. Its magnetic field is 20,000× stronger than Earth's, trapping particles in deadly radiation belts.",
  saturn: "Saturn's rings are only ~10 meters thick on average yet span 282,000 km. They're made of 99% water ice and will vanish in ~100 million years as the planet pulls them in.",
  uranus: "Uranus is an ice giant tilted on its side by an extreme 98 degrees. Methane in its cold atmosphere absorbs red light, giving it a calm, cyan-colored glow.",
  neptune: "Neptune is the most distant planet, swept by supersonic winds that reach up to 2,100 km/h. Its rich blue atmosphere is active with dark storms powered by its warm core.",
};

function streamCannedResponse(
  planetId: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void
) {
  const key = planetId.toLowerCase();
  const text = CANNED_RESPONSES[key] || CANNED_RESPONSES.default;
  const words = text.split(' ');
  let index = 0;
  const interval = setInterval(() => {
    if (index < words.length) {
      onChunk(words[index] + ' ');
      index++;
    } else {
      clearInterval(interval);
      onComplete();
    }
  }, 75);
}

export async function askAIGuide(
  message: string,
  planetId: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  const isMock = import.meta.env.VITE_USE_MOCK === 'true';

  if (isMock) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: MODEL,
          prompt: `You are an AI spacecraft guide for a space exploration app. Answer concisely in 2-3 sentences, in a cinematic, inspiring tone. Context: the user is looking at ${planetId}. Question: ${message}`,
          stream: true,
        }),
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Ollama response error: ${res.status}`);
      }

      if (!res.body) {
        throw new Error('Ollama response body is empty');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let reading = true;

      while (reading) {
        const { value, done } = await reader.read();
        if (done) {
          reading = false;
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;

          try {
            const parsed = JSON.parse(cleanLine);
            if (parsed.response) {
              onChunk(parsed.response);
            }
          } catch (e) {
            // Ignored
          }
        }
      }

      onComplete();
      return;
    } catch (err) {
      console.warn('[AIGuide] Ollama is not available. Falling back to local canned responses.', err);
      streamCannedResponse(planetId, onChunk, onComplete);
      return;
    }
  }

  // Real non-mock pathway
  try {
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${API_BASE}/api/guide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, planetId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body stream is not available');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    let reading = true;
    while (reading) {
      const { value, done } = await reader.read();
      if (done) {
        reading = false;
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        if (cleanLine.startsWith('data: ')) {
          const dataContent = cleanLine.substring(6).trim();

          if (dataContent === '[DONE]') {
            onComplete();
            return;
          }

          try {
            const parsed = JSON.parse(dataContent);
            if (parsed.text) {
              onChunk(parsed.text);
            }
          } catch (e) {
            // Skip parse errors
          }
        }
      }
    }

    onComplete();
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}
