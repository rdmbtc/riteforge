// AI Streaming Client for Real-Time Code Generation
// Uses Server-Sent Events (SSE) for streaming responses

import React from 'react';

export interface StreamChunk {
  type: 'code' | 'summary' | 'explanation' | 'status' | 'error' | 'done';
  content: string;
  timestamp: number;
}

export class StreamingClient {
  private controller: AbortController | null = null;

  /**
   * Stream contract generation with real-time updates
   */
  async *streamGeneration(prompt: string): AsyncGenerator<StreamChunk> {
    this.controller = new AbortController();

    try {
      const response = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
        signal: this.controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              yield {
                type: 'done',
                content: '',
                timestamp: Date.now(),
              };
              return;
            }

            try {
              const chunk: StreamChunk = JSON.parse(data);
              yield chunk;
            } catch (error) {
              console.error('Failed to parse chunk:', error);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        yield {
          type: 'error',
          content: 'Generation cancelled',
          timestamp: Date.now(),
        };
      } else {
        yield {
          type: 'error',
          content: error.message || 'Stream failed',
          timestamp: Date.now(),
        };
      }
    }
  }

  /**
   * Cancel ongoing stream
   */
  cancel() {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }
}

/**
 * Hook for streaming generation
 */
export function useStreamingGeneration() {
  const [code, setCode] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [explanation, setExplanation] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const clientRef = React.useRef<StreamingClient | null>(null);

  const generate = React.useCallback(async (prompt: string) => {
    setIsStreaming(true);
    setError(null);
    setCode('');
    setSummary('');
    setExplanation('');
    setStatus('Initializing...');

    const client = new StreamingClient();
    clientRef.current = client;

    try {
      for await (const chunk of client.streamGeneration(prompt)) {
        switch (chunk.type) {
          case 'code':
            setCode(prev => prev + chunk.content);
            break;
          case 'summary':
            setSummary(prev => prev + chunk.content);
            break;
          case 'explanation':
            setExplanation(prev => prev + chunk.content);
            break;
          case 'status':
            setStatus(chunk.content);
            break;
          case 'error':
            setError(chunk.content);
            setIsStreaming(false);
            break;
          case 'done':
            setStatus('Complete!');
            setIsStreaming(false);
            break;
        }
      }
    } catch (err: any) {
      setError(err.message);
      setIsStreaming(false);
    }
  }, []);

  const cancel = React.useCallback(() => {
    if (clientRef.current) {
      clientRef.current.cancel();
      clientRef.current = null;
    }
    setIsStreaming(false);
    setStatus('Cancelled');
  }, []);

  return {
    code,
    summary,
    explanation,
    status,
    isStreaming,
    error,
    generate,
    cancel,
  };
}

// For non-React usage
export { StreamingClient as default };
