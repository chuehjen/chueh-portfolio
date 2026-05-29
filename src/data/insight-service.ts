// AI 策略标签服务 — 用百炼 qwen-plus 分析每只持仓特征
// 缓存策略：7 天内的 insight 直接复用，过期或缺失时调用 API 批量更新

import { Holding, PriceSnapshot } from '../domain/types';
import {
  getHoldingInsights,
  upsertHoldingInsight,
  HoldingInsight,
} from './storage';

const BAILIAN_API_KEY = process.env.EXPO_PUBLIC_BAILIAN_API_KEY ?? '';
const BAILIAN_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

/** 五种标签语义（与竞品类似的策略分类） */
export const STRATEGY_TAGS = ['长期价值', '稳健成长', '高波动', '防御型', '投机'] as const;
export type StrategyTag = typeof STRATEGY_TAGS[number];

export const STRATEGY_DESCRIPTIONS: { name: StrategyTag; desc: string }[] = [
  { name: '长期价值', desc: '估值合理、商业模式稳定，适合长期持有获取复合回报' },
  { name: '稳健成长', desc: '行业龙头或宽基 ETF，业绩持续增长、波动可控' },
  { name: '高波动', desc: '近一年涨跌幅大、52 周高低价差超 50%，机会与风险并存' },
  { name: '防御型', desc: '公用事业/必需消费/医疗保健，弱市抗跌，分红稳定' },
  { name: '投机', desc: '小市值或盈亏剧烈偏离，需控制仓位和止损' },
];

interface AnalyzeInput {
  symbol: string;
  name: string;
  sector: string;
  pnlPercent: number;
  shares: number;
  costBasis: number;
  currentPrice: number;
  high52w: number;
  low52w: number;
}

function isFresh(updatedAt: string): boolean {
  const t = new Date(updatedAt).getTime();
  return Date.now() - t < CACHE_TTL_MS;
}

function buildPrompt(items: AnalyzeInput[]): string {
  const lines = items.map(
    (i) =>
      `${i.symbol}|${i.name}|sector:${i.sector}|price:${i.currentPrice}|cost:${i.costBasis}|pnl:${i.pnlPercent.toFixed(1)}%|52wH:${i.high52w}|52wL:${i.low52w}`
  );
  return `你是专业投资分析师。根据下列持仓信息，为每只股票判定一个策略标签和置信度（0-100）。

持仓数据（每行：symbol|name|sector|price|cost|pnl|52wHigh|52wLow）：
${lines.join('\n')}

可选标签（必须从中选一个）：长期价值 / 稳健成长 / 高波动 / 防御型 / 投机

判断逻辑参考：
- 长期价值：低波动行业（金融/消费/医疗），价格接近成本或合理估值
- 稳健成长：科技龙头（AAPL/MSFT/GOOGL/META/AMZN）、ETF
- 高波动：52w high/low 价差超过 50%、近期涨跌幅大
- 防御型：公用事业、必需消费、医疗保健
- 投机：小市值、加密资产、PNL大幅偏离

返回严格 JSON 格式（不要任何前后说明）：
{"results":[{"symbol":"AAPL","tag":"稳健成长","confidence":85,"rationale":"科技龙头长期增长稳定"}]}`;
}

async function callBailian(prompt: string): Promise<{ symbol: string; tag: string; confidence: number; rationale: string }[]> {
  if (!BAILIAN_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_BAILIAN_API_KEY');
  }
  const res = await fetch(BAILIAN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BAILIAN_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Bailian ${res.status}: ${t}`);
  }
  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');
  const parsed = JSON.parse(match[0]);
  return parsed.results ?? [];
}

/** 获取一组持仓的 AI 标签：优先返回缓存，过期/缺失部分调用 API */
export async function getInsightsForHoldings(
  holdings: Holding[],
  prices: Map<string, PriceSnapshot>
): Promise<Map<string, HoldingInsight>> {
  const symbols = holdings.map((h) => h.symbol);
  const cached = await getHoldingInsights(symbols);

  const stale: Holding[] = [];
  for (const h of holdings) {
    const c = cached.get(h.symbol);
    if (!c || !isFresh(c.updatedAt)) stale.push(h);
  }

  if (stale.length === 0) return cached;

  // 拼装 API 输入
  const inputs: AnalyzeInput[] = stale.map((h) => {
    const p = prices.get(h.symbol);
    return {
      symbol: h.symbol,
      name: h.name,
      sector: h.sector,
      pnlPercent: p ? ((p.price - h.costBasisPerShare) / h.costBasisPerShare) * 100 : 0,
      shares: h.shares,
      costBasis: h.costBasisPerShare,
      currentPrice: p?.price ?? h.costBasisPerShare,
      high52w: p?.high52w ?? 0,
      low52w: p?.low52w ?? 0,
    };
  });

  try {
    const results = await callBailian(buildPrompt(inputs));
    const now = new Date().toISOString();
    for (const r of results) {
      const insight: HoldingInsight = {
        symbol: r.symbol,
        tag: r.tag,
        confidence: Math.max(0, Math.min(100, Math.round(r.confidence))),
        rationale: r.rationale ?? '',
        updatedAt: now,
      };
      await upsertHoldingInsight(insight);
      cached.set(r.symbol, insight);
    }
  } catch (e) {
    console.warn('AI insight error', e);
    // 失败时返回已有缓存（即使过期）
  }

  return cached;
}
