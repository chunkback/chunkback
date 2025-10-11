import { GeminiStreamChunk } from '../../../api/types/gemini.types';

export function createGeminiChunk(
  content: string | null,
  isLast: boolean = false,
  toolCall?: { toolName: string; arguments: string }
): GeminiStreamChunk {
  const chunk: GeminiStreamChunk = {
    candidates: [
      {
        content: {
          parts: [],
          role: 'model',
        },
        index: 0,
      },
    ],
  };

  if (toolCall) {
    // Parse arguments as JSON if possible
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(toolCall.arguments) as Record<string, unknown>;
    } catch {
      args = { value: toolCall.arguments };
    }

    chunk.candidates[0].content.parts.push({
      functionCall: {
        name: toolCall.toolName,
        args,
      },
    });
  } else if (content !== null) {
    chunk.candidates[0].content.parts.push({
      text: content,
    });
  }

  if (isLast) {
    chunk.candidates[0].finishReason = 'STOP';
  }

  return chunk;
}
