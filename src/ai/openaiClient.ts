import type { AppConfig } from '../config.js';
import type { LlmCompletionRequest } from './types.js';

export class OpenAiCompatibleClient {
  constructor(private readonly cfg: AppConfig) {}

  async complete(req: LlmCompletionRequest): Promise<string> {
    const body = JSON.stringify({
      model: req.model,
      messages: req.messages,
      temperature: req.temperature ?? 0.2,
      response_format: req.response_format,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.cfg.AI_TIMEOUT_MS);

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.cfg.AI_API_KEY}`,
        'Content-Type': 'application/json',
      };
      if (this.cfg.AI_BASE_URL.includes('openrouter.ai')) {
        headers['HTTP-Referer'] = 'https://github.com/pro-tech-killers/coinbase-trading-bot';
        headers['X-Title'] = 'coinbase-trading-bot';
      }

      const res = await fetch(`${this.cfg.AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`LLM HTTP ${res.status}: ${text.slice(0, 200)}`);
      }

      const parsed = JSON.parse(text) as { choices?: { message?: { content?: string } }[] };
      const content = parsed.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('LLM response missing content');
      }
      return content;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`LLM request timed out after ${this.cfg.AI_TIMEOUT_MS}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
