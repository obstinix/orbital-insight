# AI_AUDIT.md — Orbital Insight
*AI/ML Systems Review — June 2026*

---

## Overview

Orbital Insight has two planned AI components per the PRD:
1. **Claude API** — Dynamic narration, Q&A, and contextual commentary (AI Spacecraft Guide)
2. **ElevenLabs TTS** — Voice synthesis for the NOVA guide character

Additionally, the platform uses a procedural audio engine with algorithmic sound generation, which while not traditional ML, represents an algorithmic intelligence layer worth reviewing.

---

## Component 1: Claude AI Guide (NOVA)

### Planned Architecture (per PRD §4.3, §6.3)
- Claude `claude-sonnet-4-20250514` for dynamic narration
- `SceneContext` injected as system prompt (planet, chapter, camera position, user discoveries)
- Adaptive difficulty based on stated knowledge level
- Proactive fact-offering when user dwells on object >5 seconds
- Conversational memory within session
- Source citation (NASA, Wikipedia, arXiv)

### Current Implementation State: ❌ Not Implemented

**Evidence:** `apps/api/src/routes/guide.ts` — full file analysis

The "AI Guide" is a static keyword-matching system:
```
// From guide.ts lines 73–87
const msgLower = message.toLowerCase();
let responseBody = facts.overview;

if (msgLower.includes('atmosphere') || msgLower.includes('air') ...) {
  responseBody = facts.atmosphere;
} else if (msgLower.includes('gravity') ...) {
  responseBody = facts.gravity;
}
```

**What this is:** A simple keyword classifier with 4 categories (overview, atmosphere, gravity, life) returning one of 40 static strings.

**What this is NOT:** An AI system. There is no model inference, no API call, no streaming completion, no context injection.

### Readiness Assessment

| Criterion | Status | Notes |
|---|---|---|
| API Integration | ❌ | `ANTHROPIC_API_KEY` defined in env but never imported |
| Scene Context Injection | ❌ | `SceneContext` type exists in shared-types but not sent to guide |
| Streaming Architecture | ✅ | SSE streaming infrastructure correct on both client and server |
| Conversational Memory | ❌ | No message history sent to API |
| Token Budget Enforcement | ❌ | No per-user or per-session limits |
| Adaptive Difficulty | ❌ | Not implemented |
| Proactive Fact Triggering | ❌ | Not implemented |
| Source Citations | ❌ | Not implemented |
| Fallback Handling | ⚠️ | Falls back to Earth facts if planet not found; not a real fallback |

**AI Guide Readiness Score: 1 / 10** (infrastructure only; zero actual AI)

### Recommended Implementation

```typescript
// apps/api/src/routes/guide.ts — proposed real implementation
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

fastify.post('/guide', async (request, reply) => {
  const { message, sceneContext, conversationHistory } = request.body;
  
  const systemPrompt = `You are NOVA, an AI spacecraft guide aboard the Orbital Insight 
exploration vessel. You provide scientifically accurate, engaging narration.
Current scene: ${JSON.stringify(sceneContext)}
Adapt your explanation depth to the user's apparent expertise level.
Cite sources (NASA, IAU, arXiv) where relevant.`;

  reply.raw.writeHead(200, { 'Content-Type': 'text/event-stream', ... });
  
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,  // Enforce token budget per response
    system: systemPrompt,
    messages: [
      ...conversationHistory,  // Session memory
      { role: 'user', content: message }
    ],
  });
  
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      reply.raw.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
    }
  }
  reply.raw.write('event: end\ndata: [DONE]\n\n');
  reply.raw.end();
});
```

**Key considerations:**
- Inject `SceneContext` with every request (coordinates, nearest body, chapter, active events)
- Store conversation history in Redis (TTL: session duration ~60 minutes)
- Rate limit: 10 messages/session, 4,000 tokens max/session for free tier
- Cache common questions (planet overviews, basic definitions) in Redis for 24h TTL

---

## Component 2: ElevenLabs TTS Voice

### Current State: ❌ Not Implemented

**Evidence:** `ELEVENLABS_API_KEY` in `.env.example`; zero ElevenLabs imports or API calls anywhere in the codebase.

### Recommended Architecture

```typescript
// apps/api/src/routes/voice.ts
fastify.post('/guide/voice', async (request, reply) => {
  const { text, voiceId } = request.body;  // voiceId = NOVA's configured voice
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
    body: JSON.stringify({ text, model_id: 'eleven_turbo_v2', voice_settings: { stability: 0.5 } }),
  });
  
  reply.raw.writeHead(200, { 'Content-Type': 'audio/mpeg' });
  response.body.pipe(reply.raw);
});
```

**Client side:** `GuideChatPanel.tsx` plays audio via `Howler.js` when response received.

**Cost estimate:** ElevenLabs Turbo v2 at ~$0.0005/character. Average NOVA response: ~300 chars = ~$0.15/1000 responses. Budget-friendly even at scale.

### TTS Readiness Score: 0 / 10 (not started)

---

## Component 3: Procedural Audio Intelligence

### Current State: ✅ Well Implemented

The `AudioEngine.ts` contains a genuine algorithmic intelligence layer:

- **Proximity hum:** Frequency modulation based on nearest planet's gravitational mass (`nearestMass`) and camera distance — scientifically inspired behavior
- **Adaptive layers:** Three concurrent layers respond to spacecraft state (IDLE/THRUSTING/WARPING)
- **Spatial positioning:** Web Audio API `PannerNode` tracks nearest planet position in 3D space
- **Reduced motion respect:** Detects `prefers-reduced-motion` and adjusts audio behavior

This is not ML but it is genuinely intelligent algorithmic behavior.

**Procedural Audio Score: 8 / 10** — Well-architected; gap is lack of sampled orchestral assets.

---

## AI System Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Prompt injection via user messages | High | Input sanitization + system prompt isolation in Anthropic SDK |
| Token cost overruns without auth | Critical | Require JWT auth; enforce per-user daily budget in Redis |
| Scientifically inaccurate AI responses | High | System prompt emphasizes accuracy + citation; human review of common questions |
| Latency: streaming TTS + streaming LLM simultaneously | Medium | LLM generates text first; TTS fires when first sentence complete |
| ElevenLabs API downtime | Low | Graceful fallback to text-only mode |

---

## AI Readiness Summary

| Component | Current | Target | Gap |
|---|---|---|---|
| Claude AI Guide | 1 / 10 | 9 / 10 | Wire real API, add context injection, session memory |
| ElevenLabs TTS | 0 / 10 | 7 / 10 | Full implementation needed |
| Procedural Audio | 8 / 10 | 9 / 10 | Add sampled orchestral assets |
| **Overall AI Score** | **1 / 10** | **9 / 10** | — |

The good news: the SSE streaming architecture, the `SceneContext` shared type, and the client-side SSE reader are all correctly designed. Wiring in the real Claude API is a backend-only change. It could be done in 3–4 days and would immediately transform the product's most important feature.
