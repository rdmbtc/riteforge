// Server-side AI Proxy - bypasses CORS
import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://api.freetheai.xyz/v1';
const ZEN_URL = 'https://opencode.ai/zen/v1';
const API_KEY = process.env.AI_API_KEY || '';
const ZEN_API_KEY = process.env.ZEN_API_KEY || '';

const AI_MODELS = [
  'minimax-m2.5-free',
  'bbg/deepseek-ai/DeepSeek-V4-Pro',
  'glm/glm-5.1',
];

const ZEN_MODEL = 'minimax-m2.5-free';

interface AIProvider {
  url: string;
  key: string;
  model: string;
}

function getProviders(customModel?: string): AIProvider[] {
  const providers: AIProvider[] = [];

  // Zen/MiniMax primary
  if (ZEN_API_KEY) {
    providers.push({ url: ZEN_URL, key: ZEN_API_KEY, model: ZEN_MODEL });
  }

  // FreeTheAI fallback
  for (const m of customModel ? [customModel, ...AI_MODELS.filter(x => x !== customModel)] : AI_MODELS) {
    providers.push({ url: API_URL, key: API_KEY, model: m });
  }

  return providers;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model, temperature, max_tokens } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    if (!API_KEY && !ZEN_API_KEY) {
      return NextResponse.json({ error: 'No API keys configured' }, { status: 500 });
    }

    const providers = getProviders(model);

    for (const provider of providers) {
      let retryCount = 0;
      try {
        const response = await fetch(`${provider.url}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: provider.model,
            messages,
            temperature: temperature || 0.7,
            max_tokens: max_tokens || 2000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }

        // 429 - retry after delay (max 3 retries per model)
        if (response.status === 429) {
          retryCount++;
          if (retryCount < 3) {
            await new Promise(r => setTimeout(r, 3000));
            continue;
          }
          continue;
        }

      } catch (e) {
        // silent
      }
    }

    return NextResponse.json({ error: 'All AI providers failed' }, { status: 502 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
