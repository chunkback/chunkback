#!/usr/bin/env node

import { createServer } from './server/create-server/create-server';

const PORT = process.env.PORT || 3000;

// Create server without any middleware (open source version)
const app = createServer();

app.listen(PORT, () => {
  console.log(`🚀 Chunkback Server running on port ${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  OpenAI:    http://localhost:${PORT}/v1/chat/completions`);
  console.log(`  Anthropic: http://localhost:${PORT}/v1/messages`);
  console.log(`  Gemini:    http://localhost:${PORT}/v1/models/:model/generateContent`);
  console.log(`  Health:    http://localhost:${PORT}/health`);
  console.log(`\n✨ No authentication required - Open source version`);
});
