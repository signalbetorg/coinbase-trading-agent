import type { StrategySignal } from '../strategy/types.js';

export type AiSpotAction = 'buy' | 'sell' | 'hold';

export type AiTradeDecision = {
  action: AiSpotAction;
  confidence: number;
  reasoning: string;
};

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type LlmCompletionRequest = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  response_format?: { type: 'json_object' };
};

export function aiActionToSignal(action: AiSpotAction): StrategySignal {
  if (action === 'buy') return 'BUY';
  if (action === 'sell') return 'SELL';
  return 'HOLD';
}
