import type { AppConfig } from '../config.js';
import type { MarketBalances, StrategyOutput, StrategySignal } from '../strategy/types.js';
import { formatMarketContext } from './formatMarketContext.js';
import { OpenAiCompatibleClient } from './openaiClient.js';
import { parseAiDecision } from './parseDecision.js';
import { SYSTEM_PROMPT, buildHybridConfirmPrompt, buildUserPrompt } from './prompts.js';
import { aiActionToSignal } from './types.js';

function withIndicators(base: StrategyOutput, signal: StrategySignal, reason: string, confidence: number, source: 'ai' | 'hybrid'): StrategyOutput {
  return {
    ...base,
    signal,
    reason,
    confidence,
    source,
  };
}

export async function evaluateAiStrategy(
  cfg: AppConfig,
  base: StrategyOutput,
  closes: number[],
  balances: MarketBalances
): Promise<StrategyOutput> {
  const llm = new OpenAiCompatibleClient(cfg);
  const marketBlock = formatMarketContext(cfg, base, closes, balances);

  const content = await llm.complete({
    model: cfg.AI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(marketBlock, cfg.PRODUCT_ID) },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const decision = parseAiDecision(content);
  const signal = aiActionToSignal(decision.action);

  if (signal !== 'HOLD' && decision.confidence < cfg.AI_MIN_CONFIDENCE) {
    return withIndicators(
      base,
      'HOLD',
      `AI confidence ${decision.confidence.toFixed(2)} below min ${cfg.AI_MIN_CONFIDENCE}`,
      decision.confidence,
      'ai'
    );
  }

  if (signal === 'BUY' && balances.inPosition) {
    return withIndicators(base, 'HOLD', 'AI suggested buy but already in position', decision.confidence, 'ai');
  }
  if (signal === 'SELL' && !balances.inPosition) {
    return withIndicators(base, 'HOLD', 'AI suggested sell but no position', decision.confidence, 'ai');
  }

  return withIndicators(base, signal, decision.reasoning, decision.confidence, 'ai');
}

export async function confirmHybridSignal(
  cfg: AppConfig,
  ema: StrategyOutput,
  closes: number[],
  balances: MarketBalances
): Promise<StrategyOutput> {
  if (ema.signal !== 'BUY' && ema.signal !== 'SELL') {
    return { ...ema, source: 'ema' };
  }

  const llm = new OpenAiCompatibleClient(cfg);
  const marketBlock = formatMarketContext(cfg, ema, closes, balances);

  const content = await llm.complete({
    model: cfg.AI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildHybridConfirmPrompt(ema.signal, ema.reason, marketBlock, cfg.PRODUCT_ID),
      },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const decision = parseAiDecision(content);
  const aiSignal = aiActionToSignal(decision.action);

  if (aiSignal !== ema.signal) {
    return {
      ...ema,
      signal: 'HOLD',
      reason: `AI rejected ${ema.signal}: ${decision.reasoning}`,
      confidence: decision.confidence,
      source: 'hybrid',
    };
  }

  if (decision.confidence < cfg.AI_MIN_CONFIDENCE) {
    return {
      ...ema,
      signal: 'HOLD',
      reason: `AI confidence ${decision.confidence.toFixed(2)} below min ${cfg.AI_MIN_CONFIDENCE}`,
      confidence: decision.confidence,
      source: 'hybrid',
    };
  }

  return {
    ...ema,
    reason: `${ema.reason} (AI confirmed: ${decision.reasoning})`,
    confidence: decision.confidence,
    source: 'hybrid',
  };
}
