/**
 * CBPL (Chunkback Prompt Language) Token Types
 *
 * Defines all token types that can appear in CBPL code.
 */

export enum TokenType {
  // Keywords
  SAY = 'SAY',
  TOOLCALL = 'TOOLCALL',
  CHUNKSIZE = 'CHUNKSIZE',
  CHUNKLATENCY = 'CHUNKLATENCY',

  // Literals
  STRING = 'STRING',
  NUMBER = 'NUMBER',

  // Special
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  INVALID = 'INVALID',
}

export interface Token {
  type: TokenType;
  value: string | number;
  line: number;
  column: number;
}

/**
 * Keywords map for quick lookup
 */
export const KEYWORDS: Record<string, TokenType> = {
  SAY: TokenType.SAY,
  TOOLCALL: TokenType.TOOLCALL,
  CHUNKSIZE: TokenType.CHUNKSIZE,
  CHUNKLATENCY: TokenType.CHUNKLATENCY,
};
