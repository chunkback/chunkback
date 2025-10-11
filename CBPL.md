# CBPL - Chunkback Prompt Language

CBPL (Chunkback Prompt Language) is a SQL-like command language for controlling LLM response generation with custom streaming and tool calling behavior.

## Architecture

CBPL uses a proper lexer/parser architecture similar to SQL parsers:

1. **Lexer** (`src/parser/lexer/`): Tokenizes input strings into a stream of tokens
2. **Parser** (`src/parser/cbpl-parser/`): Consumes tokens and builds an Abstract Syntax Tree (AST)
3. **Executor** (`src/streaming/`): Executes the AST to generate streaming responses

This architecture provides:
- Better error messages with line/column information
- Easier language extension
- More robust parsing than regex matching
- Standard compiler design patterns

## Language Syntax

### SAY Statement
Outputs text content as a streaming response.

```cbpl
SAY "Hello, World!"
```

**Syntax:**
```
SAY <string>
```

### TOOLCALL Statement
Invokes a tool/function with specified arguments.

```cbpl
TOOLCALL "get_weather" "San Francisco, CA"
```

**Syntax:**
```
TOOLCALL <tool_name> <arguments>
```

### CHUNKSIZE Statement
Sets the chunk size for subsequent SAY statements (how many characters per chunk).

```cbpl
CHUNKSIZE 5
SAY "Hello, World!"
```

**Syntax:**
```
CHUNKSIZE <number>
```

### CHUNKLATENCY Statement
Sets the delay in milliseconds between chunks for subsequent SAY statements.

```cbpl
CHUNKLATENCY 50
SAY "Hello, World!"
```

**Syntax:**
```
CHUNKLATENCY <number>
```

## Token Types

CBPL recognizes the following token types:

- **Keywords**: `SAY`, `TOOLCALL`, `CHUNKSIZE`, `CHUNKLATENCY`
- **Literals**: String literals (double-quoted), Number literals
- **Special**: Newlines, EOF (end of file)

## String Literals

Strings must be enclosed in double quotes. Escape sequences are supported:

```cbpl
SAY "Hello \"World\""        # Escaped quotes
SAY "Line 1\nLine 2"         # Newline
SAY "Tab\there"              # Tab
SAY "Backslash: \\"          # Backslash
```

## Multi-Statement Programs

CBPL supports multiple statements separated by newlines:

```cbpl
SAY "First message"
CHUNKSIZE 3
CHUNKLATENCY 50
SAY "Second message with custom chunking"
TOOLCALL "get_weather" "New York"
```

## Configuration Scope

`CHUNKSIZE` and `CHUNKLATENCY` statements affect all subsequent `SAY` statements until changed:

```cbpl
SAY "Fast with default chunking"

CHUNKSIZE 5
SAY "Now 5 chars per chunk"

CHUNKLATENCY 100
SAY "5 chars per chunk, 100ms delay"

CHUNKSIZE 10
SAY "10 chars per chunk, still 100ms delay"
```

## Examples

### Basic SAY
```cbpl
SAY "Hello, World!"
```

### Tool Call
```cbpl
TOOLCALL "search_web" "latest AI news"
```

### Custom Chunking
```cbpl
CHUNKSIZE 10
CHUNKLATENCY 50
SAY "This will stream 10 characters at a time with 50ms delay between chunks"
```

### Multiple Commands
```cbpl
SAY "Starting task..."
TOOLCALL "fetch_data" "users"
SAY "Task complete!"
```

### Complex Program
```cbpl
SAY "Analyzing your request..."
CHUNKSIZE 5
CHUNKLATENCY 30
SAY "Processing data with streaming output..."
TOOLCALL "analyze_sentiment" "This is great!"
SAY "Analysis complete!"
```

## Error Handling

The parser provides detailed error messages with line and column information:

```
Parse error at line 2, column 5: Expected string after SAY
```

Common errors:
- Missing quotes around strings
- Invalid keywords
- Missing arguments to commands
- Unrecognized tokens

## Implementation Details

### Lexer
- Character-by-character scanning
- Line and column tracking for error messages
- Whitespace handling (preserves newlines, skips spaces/tabs)
- String escape sequence support

### Parser
- Recursive descent parsing
- Token stream consumption
- AST generation
- Error recovery

### Type System
See `src/parser/types/command.types.ts` for TypeScript type definitions of the AST nodes.

## Future Extensions

Possible future additions to CBPL:

- Variables and expressions
- Conditional statements (IF/ELSE)
- Loops (FOR/WHILE)
- Comments (line and block)
- Multiple tool calls in sequence
- Async/await semantics
- Type checking
- Standard library functions
