export const SYSTEM_PROMPT = `You are a conservative spot crypto trading assistant for Coinbase Advanced Trade.
Respond ONLY with valid JSON matching this schema:
{"action":"buy"|"sell"|"hold","confidence":0-1,"reasoning":"string"}
Rules:
- Prefer "hold" when signals conflict, volatility is unclear, or data is insufficient.
- "buy" only when trend and momentum support a new long entry and you are not already long.
- "sell" only when an open long should be closed or reduced based on context.
- confidence must reflect certainty; use < 0.5 for weak setups.`;

export function buildUserPrompt(marketBlock: string, productId: string): string {
  return `Exchange: Coinbase Advanced Trade
Product: ${productId}

Market context:
${marketBlock}

Provide the next spot trade action JSON.`;
}

export function buildHybridConfirmPrompt(
  emaSignal: 'BUY' | 'SELL',
  emaReason: string,
  marketBlock: string,
  productId: string
): string {
  return `Exchange: Coinbase Advanced Trade
Product: ${productId}

The rule-based EMA strategy suggests: ${emaSignal}
Rule reason: ${emaReason}

Market context:
${marketBlock}

Confirm or reject this ${emaSignal} signal. Respond ONLY with JSON:
{"action":"buy"|"sell"|"hold","confidence":0-1,"reasoning":"string"}
Use "buy" to confirm BUY, "sell" to confirm SELL, or "hold" to reject.`;
}
