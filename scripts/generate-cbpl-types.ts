#!/usr/bin/env tsx
/**
 * CBPL Type Generator
 *
 * Generates TypeScript types from cbpl.definitions.json
 * Run with: pnpm codegen
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// Validation schema for CBPL definitions
const ParameterSchema = z.object({
  name: z.string().min(1, 'Parameter name cannot be empty'),
  type: z.enum(['string', 'number'], {
    errorMap: () => ({ message: 'Parameter type must be "string" or "number"' }),
  }),
  description: z.string().min(1, 'Parameter description cannot be empty'),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
});

const CommandDefinitionSchema = z.object({
  name: z.string().min(1, 'Command name cannot be empty'),
  description: z.string().min(1, 'Command description cannot be empty'),
  parameters: z.array(ParameterSchema).min(1, 'Command must have at least one parameter'),
  examples: z.array(z.string()).min(1, 'Command must have at least one example'),
});

const CBPLDefinitionsSchema = z
  .object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (e.g., 1.0.0)'),
    commands: z.record(
      z.string().regex(/^[A-Z]+$/, 'Command keys must be uppercase letters only'),
      CommandDefinitionSchema
    ),
  })
  .strict();

interface Parameter {
  name: string;
  type: 'string' | 'number';
  description: string;
  validation?: {
    min?: number;
    max?: number;
  };
}

interface CommandDefinition {
  name: string;
  description: string;
  parameters: Parameter[];
  examples: string[];
}

interface CBPLDefinitions {
  version: string;
  commands: Record<string, CommandDefinition>;
}

// Read and validate JSON definitions
const definitionsPath = join(__dirname, '../cbpl.definitions.json');
let rawDefinitions: unknown;

try {
  rawDefinitions = JSON.parse(readFileSync(definitionsPath, 'utf-8'));
} catch (error) {
  console.error('❌ Failed to parse cbpl.definitions.json');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

// Validate against schema
const validationResult = CBPLDefinitionsSchema.safeParse(rawDefinitions);

if (!validationResult.success) {
  console.error('❌ Invalid cbpl.definitions.json schema:');
  console.error('');

  for (const issue of validationResult.error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    console.error(`  • ${path}: ${issue.message}`);
  }

  console.error('');
  console.error('Please fix the errors above and try again.');
  process.exit(1);
}

const definitions: CBPLDefinitions = validationResult.data;

// Additional validation: ensure command names match their keys
for (const [key, command] of Object.entries(definitions.commands)) {
  if (command.name !== key) {
    console.error(`❌ Command key "${key}" does not match command name "${command.name}"`);
    console.error('   Command names must match their object keys.');
    process.exit(1);
  }
}

// Generate TypeScript code
function generateTypes(): string {
  const commandNames = Object.keys(definitions.commands);

  // Generate imports
  let code = `/**
 * CBPL Generated Types
 *
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: cbpl.definitions.json
 * Run 'pnpm codegen' to regenerate
 */

import { z } from 'zod';
import definitions from '../../../cbpl.definitions.json';

`;

  // Generate command name type
  code += `/**
 * Command names
 */
export type CBPLCommandName = ${commandNames.map((n) => `'${n}'`).join(' | ')};

`;

  // Generate command name array
  code += `/**
 * All command names
 */
export const COMMAND_NAMES: CBPLCommandName[] = [
  ${commandNames.map((n) => `'${n}'`).join(',\n  ')}
];

`;

  // Generate individual command interfaces
  for (const [cmdName, cmd] of Object.entries(definitions.commands)) {
    code += `/**
 * ${cmd.description}
 */
export interface ${cmdName}Command {
  type: '${cmdName}';
`;

    for (const param of cmd.parameters) {
      const tsType = param.type === 'string' ? 'string' : 'number';
      code += `  ${param.name}: ${tsType};\n`;
    }

    code += `}\n\n`;
  }

  // Generate union type
  code += `/**
 * All command types
 */
export type Command = ${commandNames.map((n) => `${n}Command`).join(' | ')};

`;

  // Generate Zod schemas
  code += `/**
 * Zod validation schemas
 */
export const CBPL_SCHEMAS = {
`;

  for (const [cmdName, cmd] of Object.entries(definitions.commands)) {
    code += `  ${cmdName}: {\n`;
    for (const param of cmd.parameters) {
      let schema = param.type === 'string' ? 'z.string()' : 'z.number()';

      if (param.type === 'number' && param.validation) {
        schema += '.int()';
        if (param.validation.min !== undefined) {
          if (param.validation.min === 0) {
            schema += '.nonnegative()';
          } else {
            schema += `.min(${param.validation.min})`;
          }
        }
        if (param.validation.max !== undefined) {
          schema += `.max(${param.validation.max})`;
        }
      }

      code += `    ${param.name}: ${schema},\n`;
    }
    code += `  },\n`;
  }

  code += `} as const;

`;

  // Export definitions
  code += `/**
 * Runtime command definitions (imported from JSON)
 */
export const CBPL_COMMANDS = definitions.commands;

`;

  // Helper functions
  code += `/**
 * Get command definition by name
 */
export function getCommandDefinition(name: string) {
  return CBPL_COMMANDS[name.toUpperCase() as CBPLCommandName];
}

/**
 * Check if a name is a valid command
 */
export function isValidCommand(name: string): name is CBPLCommandName {
  return COMMAND_NAMES.includes(name.toUpperCase() as CBPLCommandName);
}

/**
 * Validate command parameters
 */
export function validateParameters(
  commandName: CBPLCommandName,
  params: Record<string, any>
): { success: boolean; errors?: string[] } {
  const schemas = CBPL_SCHEMAS[commandName];
  if (!schemas) {
    return { success: false, errors: [\`Unknown command: \${commandName}\`] };
  }

  const errors: string[] = [];
  const command = CBPL_COMMANDS[commandName];

  for (const param of command.parameters) {
    const value = params[param.name];

    if (value === undefined) {
      errors.push(\`Missing required parameter: \${param.name}\`);
      continue;
    }

    const schema = (schemas as any)[param.name];
    if (schema) {
      const result = schema.safeParse(value);
      if (!result.success) {
        errors.push(\`Invalid \${param.name}: \${result.error.message}\`);
      }
    }
  }

  return errors.length > 0 ? { success: false, errors } : { success: true };
}
`;

  return code;
}

// Generate markdown documentation
function generateMarkdown(): string {
  let md = `# CBPL - Chunkback Prompt Language

> ⚠️  **AUTO-GENERATED DOCUMENTATION**
>
> This file is automatically generated from \`cbpl.definitions.json\`.
> Do not edit manually. Run \`pnpm codegen\` to regenerate.

CBPL (Chunkback Prompt Language) is a SQL-like command language for controlling LLM response generation with custom streaming and tool calling behavior.

## Commands

CBPL supports the following commands:

`;

  // Generate command documentation
  for (const [cmdName, cmd] of Object.entries(definitions.commands)) {
    md += `### ${cmdName}\n\n`;
    md += `${cmd.description}\n\n`;

    // Parameters
    if (cmd.parameters.length > 0) {
      md += `**Parameters:**\n\n`;
      for (const param of cmd.parameters) {
        md += `- \`${param.name}\` (${param.type}): ${param.description}`;
        if (param.validation) {
          const constraints = [];
          if (param.validation.min !== undefined) {
            constraints.push(`min: ${param.validation.min}`);
          }
          if (param.validation.max !== undefined) {
            constraints.push(`max: ${param.validation.max}`);
          }
          if (constraints.length > 0) {
            md += ` [${constraints.join(', ')}]`;
          }
        }
        md += `\n`;
      }
      md += `\n`;
    }

    // Syntax
    md += `**Syntax:**\n\n\`\`\`\n${cmdName}`;
    for (const param of cmd.parameters) {
      md += ` <${param.name}>`;
    }
    md += `\n\`\`\`\n\n`;

    // Examples
    if (cmd.examples.length > 0) {
      md += `**Examples:**\n\n`;
      for (const example of cmd.examples) {
        md += `\`\`\`cbpl\n${example}\n\`\`\`\n\n`;
      }
    }
  }

  // Additional documentation
  md += `## String Literals

Strings must be enclosed in double quotes. Escape sequences are supported:

\`\`\`cbpl
SAY "Hello \\"World\\""        # Escaped quotes
SAY "Line 1\\nLine 2"         # Newline
SAY "Tab\\there"              # Tab
SAY "Backslash: \\\\"          # Backslash
\`\`\`

## Multi-Statement Programs

CBPL supports multiple statements separated by newlines:

\`\`\`cbpl
SAY "First message"
CHUNKSIZE 3
CHUNKLATENCY 50
SAY "Second message with custom chunking"
TOOLCALL "get_weather" "New York"
\`\`\`

## Configuration Scope

\`CHUNKSIZE\` and \`CHUNKLATENCY\` statements affect all subsequent \`SAY\` statements until changed:

\`\`\`cbpl
SAY "Fast with default chunking"

CHUNKSIZE 5
SAY "Now 5 chars per chunk"

CHUNKLATENCY 100
SAY "5 chars per chunk, 100ms delay"

CHUNKSIZE 10
SAY "10 chars per chunk, still 100ms delay"
\`\`\`

`;

  return md;
}

// Write generated types
const typesOutputPath = join(__dirname, '../src/parser/definitions/cbpl.generated.ts');
const generatedCode = generateTypes();
writeFileSync(typesOutputPath, generatedCode, 'utf-8');

// Write generated markdown documentation
const docsOutputPath = join(__dirname, '../CBPL.md');
const generatedMarkdown = generateMarkdown();
writeFileSync(docsOutputPath, generatedMarkdown, 'utf-8');

console.log('✅ Generated CBPL types successfully!');
console.log(`📄 Types: ${typesOutputPath}`);
console.log(`📄 Docs:  ${docsOutputPath}`);
console.log(`📊 Commands: ${Object.keys(definitions.commands).join(', ')}`);
