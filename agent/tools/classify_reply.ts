import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { classifyReply } from '../../src/lib/chase/classify';

export default defineTool({
  description: 'Classify a customer reply into a structured collections intent.',
  inputSchema: z.object({
    text: z.string().min(1)
  }),
  async execute({ text }) {
    return classifyReply(text);
  }
});
