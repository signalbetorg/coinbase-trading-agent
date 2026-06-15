import 'dotenv/config';
import { getConfig, validateStrategyConfig } from './config.js';
import { runBot } from './engine/botEngine.js';

const cfg = getConfig();
validateStrategyConfig(cfg);
runBot().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
