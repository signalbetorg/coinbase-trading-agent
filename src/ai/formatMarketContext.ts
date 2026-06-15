import type { AppConfig } from '../config.js';
import type { MarketBalances, StrategyOutput } from '../strategy/types.js';

export function formatMarketContext(
  cfg: AppConfig,
  ev: StrategyOutput,
  closes: number[],
  balances: MarketBalances
): string {
  const recentCloses = closes.slice(-10).map((c) => c.toFixed(2));
  const pctChange =
    closes.length >= 2
      ? (((closes[closes.length - 1]! - closes[closes.length - 2]!) / closes[closes.length - 2]!) * 100).toFixed(3)
      : 'n/a';

  return [
    `Candle granularity: ${cfg.CANDLE_GRANULARITY}`,
    `Last close: ${ev.lastClose.toFixed(2)}`,
    `Bar change %: ${pctChange}`,
    `EMA(${cfg.EMA_FAST}): ${fmt(ev.emaFast)}`,
    `EMA(${cfg.EMA_SLOW}): ${fmt(ev.emaSlow)}`,
    `EMA(${cfg.EMA_TREND}) trend: ${fmt(ev.emaTrend)}`,
    `ATR(${cfg.ATR_PERIOD}): ${fmt(ev.atr)}`,
    `In uptrend (price > trend EMA): ${ev.inUptrend}`,
    `Bullish cross: ${ev.crossUp}`,
    `Bearish cross: ${ev.crossDown}`,
    `Rule signal: ${ev.signal}`,
    `Rule reason: ${ev.reason}`,
    `In position: ${balances.inPosition}`,
    `Base available: ${balances.baseAvail}`,
    `Quote available: ${balances.quoteAvail.toFixed(2)}`,
    `Recent closes (oldest→newest): ${recentCloses.join(', ')}`,
  ].join('\n');
}

function fmt(v: number): string {
  return Number.isFinite(v) ? v.toFixed(4) : 'n/a';
}
