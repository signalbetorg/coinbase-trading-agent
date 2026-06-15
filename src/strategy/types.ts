export type StrategySignal = 'BUY' | 'SELL' | 'HOLD';

export type StrategyMode = 'ema' | 'ai' | 'hybrid' | 'compare';

export type StrategySource = 'ema' | 'ai' | 'hybrid' | 'compare';

export type StrategyCompareSignal = {
  signal: StrategySignal;
  reason: string;
  confidence?: number;
};

export type StrategyCompare = {
  ema: StrategyCompareSignal;
  ai: StrategyCompareSignal;
  agree: boolean;
};

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
  compare?: StrategyCompare;
};

export type MarketBalances = {
  baseAvail: number;
  quoteAvail: number;
  inPosition: boolean;
};
