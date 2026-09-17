import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-side GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Analyze Forex Signal with Gemini AI
app.post('/api/gemini/analyze-signal', async (req, res) => {
  try {
    const { pair, price, timeframe, indicators, currentTrend, openPositionsCount } = req.body;
    const ai = getGenAI();

    if (!ai) {
      // Fallback algorithmic analysis if no API key is provided
      const rsi = indicators?.rsi ?? 50;
      const macdHist = indicators?.macdHist ?? 0;
      const isOversold = rsi < 32;
      const isOverbought = rsi > 68;

      let action = 'NEUTRAL';
      let confidence = 65;
      let reasoning = 'Algorithmic fallback mode: RSI and momentum neutral.';

      if (isOversold && macdHist > -0.0005) {
        action = 'STRONG_BUY';
        confidence = 84;
        reasoning = `Pair ${pair} in severe oversold zone (RSI ${rsi.toFixed(1)}) with MACD histogram decelerating downward. High probability mean-reversion setup.`;
      } else if (isOverbought && macdHist < 0.0005) {
        action = 'STRONG_SELL';
        confidence = 82;
        reasoning = `Pair ${pair} exhausted in overbought territory (RSI ${rsi.toFixed(1)}) with MACD divergence showing loss of buyers.`;
      } else if (indicators?.ema9 > indicators?.ema21) {
        action = 'BUY';
        confidence = 72;
        reasoning = `Bullish EMA crossover alignment (EMA 9 > EMA 21) indicating continuing upward trend on ${timeframe} timeframe.`;
      } else if (indicators?.ema9 < indicators?.ema21) {
        action = 'SELL';
        confidence = 71;
        reasoning = `Bearish EMA crossover structure (EMA 9 < EMA 21) indicating persistent downward pressure.`;
      }

      const pipSize = pair?.includes('JPY') ? 0.01 : (pair === 'XAU/USD' ? 0.1 : 0.0001);
      const slPips = 20;
      const tpPips = 38;
      const slPrice = action.includes('BUY') ? price - (slPips * pipSize) : price + (slPips * pipSize);
      const tpPrice = action.includes('BUY') ? price + (tpPips * pipSize) : price - (tpPips * pipSize);

      return res.json({
        action,
        confidence,
        entryPrice: price,
        stopLossPrice: Number(slPrice.toFixed(pair?.includes('JPY') ? 3 : 5)),
        takeProfitPrice: Number(tpPrice.toFixed(pair?.includes('JPY') ? 3 : 5)),
        stopLossPips: slPips,
        takeProfitPips: tpPips,
        riskRewardRatio: '1:1.9',
        reasoning,
        factors: [
          `RSI 14 at ${rsi.toFixed(1)}`,
          `MACD momentum histogram: ${macdHist > 0 ? 'Bullish' : 'Bearish'}`,
          `EMA 9 vs EMA 21: ${indicators?.ema9 > indicators?.ema21 ? 'Golden cross bias' : 'Death cross bias'}`,
          `Dynamic ATR Volatility: ${indicators?.atr ? (indicators.atr / pipSize).toFixed(1) + ' pips' : 'Normal'}`,
        ],
        trailingStopRecommended: true,
        marketSentiment: action.includes('BUY') ? 'Bullish Momentum' : (action.includes('SELL') ? 'Bearish Exhaustion' : 'Consolidating'),
      });
    }

    const prompt = `You are an elite quantitative algorithmic forex trading system and institutional currency strategist.
Analyze the following live technical parameters for Forex Currency Pair ${pair}:
- Current Market Price: ${price}
- Timeframe: ${timeframe || '15M'}
- Indicator Snapshot:
  * RSI (14): ${indicators?.rsi?.toFixed(2) ?? 'N/A'}
  * EMA 9: ${indicators?.ema9?.toFixed(5) ?? 'N/A'}
  * EMA 21: ${indicators?.ema21?.toFixed(5) ?? 'N/A'}
  * EMA 50: ${indicators?.ema50?.toFixed(5) ?? 'N/A'}
  * MACD Line: ${indicators?.macd?.toFixed(5) ?? 'N/A'} | Signal: ${indicators?.signalLine?.toFixed(5) ?? 'N/A'} | Histogram: ${indicators?.macdHist?.toFixed(5) ?? 'N/A'}
  * Bollinger Upper: ${indicators?.upperBand?.toFixed(5) ?? 'N/A'} | Lower: ${indicators?.lowerBand?.toFixed(5) ?? 'N/A'}
  * ATR (14): ${indicators?.atr?.toFixed(5) ?? 'N/A'}
- Current Market Trend: ${currentTrend || 'Ranging'}
- Open Active Positions: ${openPositionsCount ?? 0}

Respond ONLY with valid JSON in this exact structure without markdown formatting or code blocks:
{
  "action": "STRONG_BUY" or "BUY" or "NEUTRAL" or "SELL" or "STRONG_SELL",
  "confidence": number between 40 and 95,
  "entryPrice": number,
  "stopLossPrice": number,
  "takeProfitPrice": number,
  "stopLossPips": number,
  "takeProfitPips": number,
  "riskRewardRatio": "string (e.g. 1:2.1)",
  "reasoning": "string concise 2-sentence institutional technical explanation",
  "factors": ["factor 1", "factor 2", "factor 3", "factor 4"],
  "trailingStopRecommended": boolean,
  "marketSentiment": "string (e.g. Bullish Breakout, Bearish Pullback, Ranging Squeeze)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    const parsed = JSON.parse(responseText.trim());
    return res.json(parsed);
  } catch (err: any) {
    console.error('Gemini signal analysis error:', err);
    res.status(500).json({
      error: 'Failed to generate AI forex signal',
      details: err?.message || String(err),
    });
  }
});

// Generate Custom Algorithmic Trading Strategy with Gemini
app.post('/api/gemini/generate-strategy', async (req, res) => {
  try {
    const { traderStyle, riskPreference, preferredPairs } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        strategyName: 'Alpha Scalper Volatility Engine',
        description: 'High-frequency momentum scalping bot designed for low-spread majors like EUR/USD and GBP/USD.',
        recommendedPairs: ['EUR/USD', 'GBP/USD'],
        timeframe: '5M',
        lotSize: 0.1,
        stopLossPips: 12,
        takeProfitPips: 24,
        trailingStopPips: 8,
        rules: [
          'Enter BUY when 5M Candle closes above EMA 9 with RSI crossing 50 from below',
          'Enter SELL when 5M Candle closes below EMA 9 with RSI crossing 50 from above',
          'Enforce strict 1:2 Risk-Reward ratio with trailing stop activated at +6 pips profit',
          'Halt robot during high-impact central bank announcements'
        ]
      });
    }

    const prompt = `As a Senior Algorithmic Forex Trading Developer, build a specialized automated trading robot strategy specification.
Trader Profile:
- Trading Style: ${traderStyle || 'Scalper'}
- Risk Appetite: ${riskPreference || 'Moderate'}
- Preferred Pairs: ${preferredPairs?.join(', ') || 'EUR/USD, GBP/USD, USD/JPY'}

Output strict JSON with fields:
{
  "strategyName": "string",
  "description": "string",
  "recommendedPairs": ["string"],
  "timeframe": "1M" | "5M" | "15M" | "1H",
  "lotSize": number (e.g. 0.05 to 0.5),
  "stopLossPips": number,
  "takeProfitPips": number,
  "trailingStopPips": number,
  "rules": ["string", "string", "string", "string"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse((response.text || '{}').trim());
    return res.json(parsed);
  } catch (err: any) {
    console.error('Gemini generate strategy error:', err);
    res.status(500).json({ error: 'Failed to generate strategy' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Forex Auto Trading Robot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
