import { defineAgent } from 'eve';

const model =
  process.env.AI_MODEL_GENERATE?.trim() || process.env.EVE_MODEL?.trim() || 'openai/gpt-4.1-mini';

export default defineAgent({
  model
});
