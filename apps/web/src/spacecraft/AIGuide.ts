export interface GuideMessage {
  sender: 'user' | 'nova';
  text: string;
  timestamp: Date;
}

/**
 * Sends a message to the AI Spacecraft Guide endpoint and streams back the responses.
 * @param message The user's message query.
 * @param planetId The currently selected planet context.
 * @param onChunk Callback triggered when a new text chunk is streamed.
 * @param onComplete Callback triggered when the stream finishes.
 * @param onError Callback triggered if a connection or streaming error occurs.
 */
export async function askAIGuide(
  message: string,
  planetId: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    // API server runs on port 3000
    const response = await fetch('http://localhost:3000/api/guide', {
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

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Save any partial line back to the buffer
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
            // Skip parse errors for non-JSON lines
          }
        }
      }
    }
    
    onComplete();
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}
