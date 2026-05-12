// Streaming Contract Generation API
// Uses Server-Sent Events (SSE) for streaming AI responses

import { NextRequest } from 'next/server';

const API_URL = 'https://api.freetheai.xyz/v1';
const API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY || '';

// AI models - using verified freetheai.xyz models that work
const AI_MODELS = [
  'cat/claude-4-5-sonnet',
  'cat/claude-4-5-haiku',
  'cat/claude-4-6-sonnet',
  'bbg/deepseek-ai/DeepSeek-V4-Pro',
  'glm/glm-5.1',
];

interface StreamChunk {
  type: 'code' | 'summary' | 'explanation' | 'status' | 'error' | 'done';
  content: string;
  timestamp: number;
}

function sendChunk(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  chunk: StreamChunk
) {
  const data = `data: ${JSON.stringify(chunk)}\n\n`;
  controller.enqueue(encoder.encode(data));
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Initial status
          sendChunk(controller, encoder, {
            type: 'status',
            content: 'Starting AI...',
            timestamp: Date.now(),
          });

          const systemPrompt = `You are RiteForge AI, an expert Solidity smart contract developer.

Return ONLY valid JSON (no markdown):
{"code": "/* SPDX */\npragma solidity ^0.8.19;\n// ...", "summary": "Brief summary", "explanation": "Explanation"}`;

          const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create a Solidity contract for Ritual Chain: ${prompt}` },
          ];

          // Try each model
          let fullResponse = '';
          let usedModel = '';

          for (const model of AI_MODELS) {
            try {
              sendChunk(controller, encoder, {
                type: 'status',
                content: `Using ${model.split('/').pop()}...`,
                timestamp: Date.now(),
              });

              const response = await fetch(`${API_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: model,
                  messages: messages,
                  temperature: 0.7,
                  max_tokens: 4000,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                fullResponse = data.choices?.[0]?.message?.content || '';
                usedModel = model;
                console.log('✅ AI Success:', model);
                break;
              }
            } catch (e) {
              console.warn(`Model ${model} failed`);
            }
          }

          if (!fullResponse) {
            throw new Error('All AI models failed');
          }

          sendChunk(controller, encoder, {
            type: 'status',
            content: 'Parsing response...',
            timestamp: Date.now(),
          });

          // Parse JSON
          let result = { code: fullResponse, summary: 'Generated contract', explanation: 'Review the code below.' };

          try {
            const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                              fullResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                              fullResponse.match(/(\{[\s\S]*\})/);

            if (jsonMatch) {
              result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } else {
              result = JSON.parse(fullResponse);
            }
          } catch (e) {
            console.warn('JSON parse failed, using raw response');
          }

          // Stream code
          sendChunk(controller, encoder, {
            type: 'status',
            content: 'Writing code...',
            timestamp: Date.now(),
          });

          const codeChars = (result.code || fullResponse).split('');
          for (let i = 0; i < codeChars.length; i++) {
            sendChunk(controller, encoder, {
              type: 'code',
              content: codeChars[i],
              timestamp: Date.now(),
            });
            if (i % 100 === 0) await new Promise(r => setTimeout(r, 3));
          }

          // Summary
          if (result.summary) {
            sendChunk(controller, encoder, {
              type: 'summary',
              content: result.summary,
              timestamp: Date.now(),
            });
          }

          // Explanation
          if (result.explanation) {
            sendChunk(controller, encoder, {
              type: 'explanation',
              content: result.explanation,
              timestamp: Date.now(),
            });
          }

          // Complete
          sendChunk(controller, encoder, {
            type: 'status',
            content: 'Complete!',
            timestamp: Date.now(),
          });

          sendChunk(controller, encoder, {
            type: 'done',
            content: '',
            timestamp: Date.now(),
          });

          controller.close();

        } catch (error: any) {
          console.error('Stream error:', error);
          try {
            sendChunk(controller, encoder, {
              type: 'error',
              content: error.message || 'Generation failed',
              timestamp: Date.now(),
            });
            sendChunk(controller, encoder, {
              type: 'done',
              content: '',
              timestamp: Date.now(),
            });
          } catch (e) {
            // ignore
          }
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}