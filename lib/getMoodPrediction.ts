// lib/getMoodPrediction.ts
// Server-only: calls OpenAI to predict moods + solutions based on cycle data.

export interface MoodPrediction {
  moods: string[]           // e.g. ["anxious", "fatigued", "sensitive"]
  energy: 'low' | 'medium' | 'high'
  headline: string          // one-line summary, e.g. "A slower, tender day"
  solutions: Solution[]
}

export interface Solution {
  category: 'movement' | 'nutrition' | 'mindset' | 'social' | 'self-care'
  tip: string               // short, actionable, 1 sentence
}

interface CycleContext {
  phase: string             // menstrual | follicular | ovulation | luteal | unknown
  phaseDay: number          // day within cycle
  avgCycle: number
  avgPeriod: number
  recentSymptoms: string[]  // flattened symptom names from last few entries
  recentMoods: string[]     // mood labels from last few entries
  recentPainTypes: string[] // e.g. ["cramps", "headache"]
  maxRecentPain: number     // 1–5
}

export async function getMoodPrediction(ctx: CycleContext): Promise<MoodPrediction | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const prompt = `You are a compassionate women's health assistant with deep knowledge of menstrual cycle phases and their hormonal effects on mood, energy, and physical wellbeing.

Given the following cycle data, predict the likely emotional and physical state for today and provide 4 targeted, practical solutions.

Cycle data:
- Phase: ${ctx.phase} (day ${ctx.phaseDay} of a ${ctx.avgCycle}-day cycle, ${ctx.avgPeriod}-day period)
- Recent symptoms reported: ${ctx.recentSymptoms.length ? ctx.recentSymptoms.join(', ') : 'none'}
- Recent moods logged: ${ctx.recentMoods.length ? ctx.recentMoods.join(', ') : 'none'}
- Recent pain types: ${ctx.recentPainTypes.length ? ctx.recentPainTypes.join(', ') : 'none'}
- Max recent pain severity: ${ctx.maxRecentPain}/5

Respond ONLY with a valid JSON object, no markdown, no extra text:
{
  "moods": ["<mood1>", "<mood2>", "<mood3>"],
  "energy": "<low|medium|high>",
  "headline": "<one warm, poetic line describing today's emotional texture, 6–10 words>",
  "solutions": [
    { "category": "<movement|nutrition|mindset|social|self-care>", "tip": "<practical, specific, 1 sentence>" },
    { "category": "...", "tip": "..." },
    { "category": "...", "tip": "..." },
    { "category": "...", "tip": "..." }
  ]
}

Rules:
- moods: 3 honest likely moods for this cycle phase, influenced by logged symptoms and pain
- headline: warm and empathetic, not clinical
- solutions: all 4 must be from different categories, very specific and actionable, not generic
- energy: reflect the typical hormonal state for this phase day`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) return null

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean) as MoodPrediction
    return parsed
  } catch {
    return null
  }
}