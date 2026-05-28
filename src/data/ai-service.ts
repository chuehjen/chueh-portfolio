import { Holding, PriceSnapshot, HealthScoreResult } from '../domain/types';

const BAILIAN_API_KEY = process.env.EXPO_PUBLIC_BAILIAN_API_KEY ?? '';
const BAILIAN_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

interface AIInsight {
  summary: string;
  suggestions: string[];
  sentiment: 'bullish' | 'neutral' | 'bearish';
}

export async function analyzePortfolio(
  holdings: Holding[],
  prices: Map<string, PriceSnapshot>,
  healthScore: HealthScoreResult
): Promise<AIInsight> {
  const holdingSummary = holdings.map((h) => {
    const price = prices.get(h.symbol);
    const currentValue = price ? price.price * h.shares : h.costBasisPerShare * h.shares;
    const pnl = price ? (price.price - h.costBasisPerShare) * h.shares : 0;
    const pnlPct = price ? ((price.price - h.costBasisPerShare) / h.costBasisPerShare * 100) : 0;
    return `${h.symbol}(${h.name}): ${h.shares}股, 成本${h.costBasisPerShare}, 现价${price?.price ?? '未知'}, 盈亏${pnl.toFixed(0)}(${pnlPct.toFixed(1)}%), 行业${h.sector}`;
  }).join('\n');

  const prompt = `你是一位专业投资顾问。请根据以下持仓数据给出简洁的中文分析（3句话以内的总结 + 2-3条建议）。
语气轻松专业，不要太正式。

持仓明细：
${holdingSummary}

组合健康度：${healthScore.overall}/100
- 集中度：${healthScore.components.concentration}
- 行业分散：${healthScore.components.diversification}
- 波动率：${healthScore.components.volatility}
- 回撤：${healthScore.components.drawdown}

风险提示：${healthScore.alerts.join('；') || '无'}

请返回JSON格式：{"summary":"总结","suggestions":["建议1","建议2"],"sentiment":"bullish/neutral/bearish"}`;

  try {
    const response = await fetch(BAILIAN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BAILIAN_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response');

    const parsed = JSON.parse(content) as AIInsight;
    return parsed;
  } catch (error) {
    return {
      summary: '暂时无法获取AI分析，请稍后再试',
      suggestions: [],
      sentiment: 'neutral',
    };
  }
}
