/**
 * Main entry point for parsing CBPL (Chunkback Prompt Language)
 *
 * This function now uses a proper lexer/parser architecture instead of regex matching.
 */

import { ParsedPrompt } from '../types/command.types';
import { parseCBPL } from '../cbpl-parser/cbpl-parser';

export function parsePrompt(prompt: string): ParsedPrompt {
  return parseCBPL(prompt);
}
