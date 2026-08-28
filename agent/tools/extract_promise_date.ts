import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { extractPromiseDate } from '../../src/lib/chase/classify';

export default defineTool({
  description: 'Extract a promised payment date (YYYY-MM-DD) from customer text. Null if none.',
  inputSchema: z.object({
    text: z.string().min(1)
  }),
  async execute({ text }) {
    return extractPromiseDate(text);
  }
});
