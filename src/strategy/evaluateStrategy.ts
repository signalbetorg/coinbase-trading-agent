import type { AppConfig } from '../config.js';
import { confirmHybridSignal, evaluateAiStrategy } from '../ai/aiStrategy.js';
import { evaluateEmaCrossTrend } from './emaCrossTrendStrategy.js';
import type { MarketBalances, StrategyOutput } from './types.js';

export async function evaluateStrategy(
  cfg: AppConfig,
  highs: number[],
  lows: number[],
  closes: number[],
  balances: MarketBalances
): Promise<StrategyOutput> {
  const ema = evaluateEmaCrossTrend(cfg, highs, lows, closes);

  if (cfg.STRATEGY_MODE === 'ema') {
    return { ...ema, source: 'ema' };
  }

  if (cfg.STRATEGY_MODE === 'compare') {
    const emaOut = { ...ema, source: 'ema' as const };
    let aiOut: StrategyOutput;
    try {
      aiOut = await evaluateAiStrategy(cfg, ema, closes, balances);
    } catch (err) {
      aiOut = {
        ...ema,
        signal: 'HOLD',
        reason: `AI error: ${String(err)}`,
        source: 'ai',
      };
    }

    const agree = emaOut.signal === aiOut.signal;

    return {
      ...ema,
      signal: 'HOLD',
      reason: 'compare mode — observation only, no orders placed',
      source: 'compare',
      compare: {
        ema: { signal: emaOut.signal, reason: emaOut.reason },
        ai: {
          signal: aiOut.signal,
          reason: aiOut.reason,
          confidence: aiOut.confidence,
        },
        agree,
      },
    };
  }

  if (cfg.STRATEGY_MODE === 'ai') {
    try {
      return await evaluateAiStrategy(cfg, ema, closes, balances);
    } catch (err) {
      return {
        ...ema,
        signal: 'HOLD',
        reason: `AI error, holding: ${String(err)}`,
        source: 'ai',
      };
    }
  }

  try {
    return await confirmHybridSignal(cfg, ema, closes, balances);
  } catch (err) {
    return {
      ...ema,
      signal: 'HOLD',
      reason: `AI confirm error, holding: ${String(err)}`,
      source: 'hybrid',
    };
  }
}
