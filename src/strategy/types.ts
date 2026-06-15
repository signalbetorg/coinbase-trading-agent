export type StrategySignal = 'BUY' | 'SELL' | 'HOLD';

export type StrategyMode = 'ema' | 'ai' | 'hybrid';

export type StrategySource = 'ema' | 'ai' | 'hybrid';

export type StrategyOutput = {
  signal: StrategySignal;
  lastClose: number;
  emaFast: number;
  emaSlow: number;
  emaTrend: number;
  atr: number;
  inUptrend: boolean;
  crossUp: boolean;
  crossDown: boolean;
  reason: string;
  confidence?: number;
  source?: StrategySource;
};

export type MarketBalances = {
  baseAvail: number;
  quoteAvail: number;
  inPosition: boolean;
};
