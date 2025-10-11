/**
 * CBPL (Chunkback Prompt Language) Lexer
 *
 * Tokenizes CBPL input strings into a stream of tokens.
 * Similar to SQL lexers, it reads character by character and produces tokens.
 */

import { Token, TokenType, KEYWORDS } from './token.types';

export class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private currentChar: string | null;

  constructor(input: string) {
    this.input = input;
    this.currentChar = input.length > 0 ? input[0] : null;
  }

  /**
   * Main method: tokenize the entire input
   */
  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.currentChar !== null) {
      // Skip whitespace (except newlines)
      if (this.isWhitespace(this.currentChar) && this.currentChar !== '\n') {
        this.skipWhitespace();
        continue;
      }

      // Handle newlines
      if (this.currentChar === '\n') {
        tokens.push(this.makeToken(TokenType.NEWLINE, '\n'));
        this.advance();
        continue;
      }

      // Handle string literals (double quotes)
      if (this.currentChar === '"') {
        tokens.push(this.readString());
        continue;
      }

      // Handle numbers
      if (this.isDigit(this.currentChar)) {
        tokens.push(this.readNumber());
        continue;
      }

      // Handle keywords and identifiers
      if (this.isAlpha(this.currentChar)) {
        tokens.push(this.readKeyword());
        continue;
      }

      // Invalid character
      tokens.push(this.makeToken(TokenType.INVALID, this.currentChar));
      this.advance();
    }

    // Add EOF token
    tokens.push(this.makeToken(TokenType.EOF, ''));

    return tokens;
  }

  /**
   * Advance to the next character
   */
  private advance(): void {
    if (this.currentChar === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }

    this.position++;
    this.currentChar = this.position < this.input.length ? this.input[this.position] : null;
  }

  /**
   * Peek at the next character without advancing
   */
  private peek(offset: number = 1): string | null {
    const pos = this.position + offset;
    return pos < this.input.length ? this.input[pos] : null;
  }

  /**
   * Skip whitespace characters (except newlines)
   */
  private skipWhitespace(): void {
    while (this.currentChar !== null && this.isWhitespace(this.currentChar) && this.currentChar !== '\n') {
      this.advance();
    }
  }

  /**
   * Read a string literal (enclosed in double quotes)
   */
  private readString(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    // Skip opening quote
    this.advance();

    while (this.currentChar !== null && this.currentChar !== '"') {
      // Handle escape sequences
      if (this.currentChar === '\\' && this.peek() === '"') {
        this.advance(); // Skip backslash
        value += '"';
        this.advance();
      } else if (this.currentChar === '\\' && this.peek() === 'n') {
        this.advance(); // Skip backslash
        value += '\n';
        this.advance();
      } else if (this.currentChar === '\\' && this.peek() === 't') {
        this.advance(); // Skip backslash
        value += '\t';
        this.advance();
      } else if (this.currentChar === '\\' && this.peek() === '\\') {
        this.advance(); // Skip backslash
        value += '\\';
        this.advance();
      } else {
        value += this.currentChar;
        this.advance();
      }
    }

    // Skip closing quote
    if (this.currentChar === '"') {
      this.advance();
    }

    return {
      type: TokenType.STRING,
      value,
      line: startLine,
      column: startColumn
    };
  }

  /**
   * Read a number literal
   */
  private readNumber(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    while (this.currentChar !== null && this.isDigit(this.currentChar)) {
      value += this.currentChar;
      this.advance();
    }

    return {
      type: TokenType.NUMBER,
      value: parseInt(value, 10),
      line: startLine,
      column: startColumn
    };
  }

  /**
   * Read a keyword or identifier
   */
  private readKeyword(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    while (this.currentChar !== null && this.isAlphaNumeric(this.currentChar)) {
      value += this.currentChar;
      this.advance();
    }

    // Check if it's a keyword
    const keyword = value.toUpperCase();
    const tokenType = KEYWORDS[keyword] || TokenType.INVALID;

    return {
      type: tokenType,
      value: keyword,
      line: startLine,
      column: startColumn
    };
  }

  /**
   * Create a token
   */
  private makeToken(type: TokenType, value: string | number): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column
    };
  }

  /**
   * Helper: check if character is whitespace
   */
  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\r' || char === '\n';
  }

  /**
   * Helper: check if character is a digit
   */
  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  /**
   * Helper: check if character is alphabetic
   */
  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  /**
   * Helper: check if character is alphanumeric
   */
  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}
