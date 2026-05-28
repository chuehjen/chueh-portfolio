import { Holding } from '../domain/types';
import { getSector } from './sector-map';

const BAILIAN_API_KEY = process.env.EXPO_PUBLIC_BAILIAN_API_KEY ?? '';
const BAILIAN_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export interface RecognizedHolding {
  symbol: string;
  name: string;
  shares: number;
  costBasisPerShare: number;
  currency: string;
}

export interface RecognitionResult {
  holdings: RecognizedHolding[];
  source: 'futu' | 'firstrade' | 'unknown';
  confidence: string;
}

export async function recognizeHoldingsFromImage(base64Image: string): Promise<RecognitionResult> {
  const prompt = `你是一位专业的持仓数据识别专家。请从这张券商App截图中提取所有持仓信息。

识别规则：
1. 如果是富途牛牛（Futu/moomoo）截图：提取股票代码（含.HK/.US后缀）、名称、持有数量、成本价/买入均价
2. 如果是FirstTrade截图：提取Symbol、Description、Quantity、Cost Basis (per share)
3. 货币：港股用HKD，美股用USD，A股用CNY

请返回严格JSON格式：
{
  "holdings": [
    {"symbol": "AAPL", "name": "Apple Inc", "shares": 100, "costBasisPerShare": 150.5, "currency": "USD"}
  ],
  "source": "futu" 或 "firstrade" 或 "unknown",
  "confidence": "high" 或 "medium" 或 "low"
}

注意：
- symbol标准化：港股用5位数字+.HK（如00700.HK），美股直接用代码
- 如果截图模糊或无法识别，返回空holdings数组
- 只返回JSON，不要其他文字`;

  try {
    const response = await fetch(BAILIAN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BAILIAN_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/png;base64,${base64Image}` },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response');

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]) as RecognitionResult;
    return parsed;
  } catch (error) {
    console.error('Recognition error:', error);
    return { holdings: [], source: 'unknown', confidence: 'low' };
  }
}

export function convertToHoldings(recognized: RecognizedHolding[]): Holding[] {
  return recognized.map((r, index) => ({
    id: `import-${Date.now()}-${index}`,
    symbol: r.symbol,
    name: r.name,
    shares: r.shares,
    costBasisPerShare: r.costBasisPerShare,
    currency: r.currency,
    sector: getSector(r.symbol),
    importedAt: new Date().toISOString().split('T')[0],
  }));
}
