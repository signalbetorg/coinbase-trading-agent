import { z } from 'zod';
import { CandleGranularity } from 'coinbase-advanced-node';

const granularityValues = [
  'ONE_MINUTE',
  'FIVE_MINUTE',
  'FIFTEEN_MINUTE',
  'THIRTY_MINUTE',
  'ONE_HOUR',
  'TWO_HOUR',
  'SIX_HOUR',
  'ONE_DAY',
] as const;

const strategyModes = ['ema', 'ai', 'hybrid'] as const;

const envSchema = z.object({
  PAPER_TRADING: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? true : !['0', 'false', 'no', 'off'].includes(v.toLowerCase()))),
  PRODUCT_ID: z.string().min(1).default('BTC-USD'),
  CANDLE_GRANULARITY: z.enum(granularityValues).default('FIVE_MINUTE'),
  POLL_MS: z.coerce.number().int().min(10_000).default(60_000),
  STRATEGY_MODE: z.enum(strategyModes).default('ema'),
  EMA_FAST: z.coerce.number().int().min(2).default(12),
  EMA_SLOW: z.coerce.number().int().min(3).default(26),
  EMA_TREND: z.coerce.number().int().min(20).default(200),
  ATR_PERIOD: z.coerce.number().int().min(2).default(14),
  RISK_PER_TRADE: z.coerce.number().min(0.0001).max(1).default(0.02),
  MAX_QUOTE_PER_ORDER: z.coerce.number().optional(),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z
    .string()
    .optional()
    .transform((v) => (v ?? 'https://api.openai.com/v1').replace(/\/$/, '')),
  AI_MODEL: z.string().min(1).default('gpt-4o-mini'),
  AI_MIN_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.55),
  AI_TIMEOUT_MS: z.coerce.number().int().min(5_000).default(30_000),
  API_KEY: z.string().optional(),
  API_SECRET: z.string().optional(),
  CDP_API_KEY_NAME: z.string().optional(),
  CDP_API_KEY_SECRET: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema> & {
  candleGranularity: CandleGranularity;
};

function parseProcessEnv(): AppConfig {
  const raw = envSchema.parse({
    PAPER_TRADING: process.env.PAPER_TRADING,
    PRODUCT_ID: process.env.PRODUCT_ID,
    CANDLE_GRANULARITY: process.env.CANDLE_GRANULARITY,
    POLL_MS: process.env.POLL_MS,
    STRATEGY_MODE: process.env.STRATEGY_MODE,
    EMA_FAST: process.env.EMA_FAST,
    EMA_SLOW: process.env.EMA_SLOW,
    EMA_TREND: process.env.EMA_TREND,
    ATR_PERIOD: process.env.ATR_PERIOD,
    RISK_PER_TRADE: process.env.RISK_PER_TRADE,
    MAX_QUOTE_PER_ORDER: process.env.MAX_QUOTE_PER_ORDER,
    AI_API_KEY: process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY,
    AI_BASE_URL: process.env.AI_BASE_URL,
    AI_MODEL: process.env.AI_MODEL,
    AI_MIN_CONFIDENCE: process.env.AI_MIN_CONFIDENCE,
    AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS,
    API_KEY: process.env.API_KEY,
    API_SECRET: process.env.API_SECRET,
    CDP_API_KEY_NAME: process.env.CDP_API_KEY_NAME,
    CDP_API_KEY_SECRET: process.env.CDP_API_KEY_SECRET,
  });

  if (!raw.EMA_FAST || !raw.EMA_SLOW) {
    throw new Error('EMA parameters invalid');
  }
  if (raw.EMA_FAST >= raw.EMA_SLOW) {
    throw new Error('EMA_FAST must be less than EMA_SLOW');
  }
  if (raw.EMA_TREND <= raw.EMA_SLOW) {
    throw new Error('EMA_TREND should be greater than EMA_SLOW for a meaningful filter');
  }

  return {
    ...raw,
    candleGranularity: raw.CANDLE_GRANULARITY as unknown as CandleGranularity,
  };
}

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!cached) {
    cached = parseProcessEnv();
  }
  return cached;
}

export function validateStrategyConfig(cfg: AppConfig): void {
  if ((cfg.STRATEGY_MODE === 'ai' || cfg.STRATEGY_MODE === 'hybrid') && !cfg.AI_API_KEY?.trim()) {
    throw new Error('STRATEGY_MODE ai/hybrid requires AI_API_KEY (or OPENAI_API_KEY)');
  }
}

export function parseProductId(productId: string): { base: string; quote: string } {
  const parts = productId.split('-');
  if (parts.length < 2) {
    throw new Error(`Invalid PRODUCT_ID ${productId}; expected e.g. BTC-USD`);
  }
  return { base: parts[0]!, quote: parts[parts.length - 1]! };
}
