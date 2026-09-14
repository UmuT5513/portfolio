export const CATEGORIES = [
  'chatbot',
  'rag',
  'agents',
  'llm',
  'fine-tuning',
  'traditional-machine-learning',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}