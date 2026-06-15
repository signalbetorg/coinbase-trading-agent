import type { AiSpotAction, AiTradeDecision } from './types.js';

const ACTIONS: AiSpotAction[] = ['buy', 'sell', 'hold'];

export function parseAiDecision(raw: string): AiTradeDecision {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error('AI response is not valid JSON');
  }

  const action = String(obj.action ?? '').toLowerCase() as AiSpotAction;
  if (!ACTIONS.includes(action)) {
    throw new Error(`Invalid action: ${String(obj.action)}`);
  }

  const confidence = Number(obj.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error('confidence must be 0-1');
  }

  const reasoning = String(obj.reasoning ?? '').slice(0, 500);
  return { action, confidence, reasoning };
}
