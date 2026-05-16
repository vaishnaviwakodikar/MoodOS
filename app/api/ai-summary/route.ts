import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { entries } = await request.json()

  if (!entries || entries.length === 0) {
    return NextResponse.json({ summary: 'No mood entries yet to analyze!' })
  }

  const moodText = entries.map((e: any) =>
    `${new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}: felt ${e.mood} (score ${e.score}/5)${e.note ? ` — note: "${e.note}"` : ''}`
  ).join('\n')

  const prompt = `You are a Gen Z friendly wellness assistant for a student named Vaishnavi. Analyze her mood entries and give a short, fun, supportive summary report. Be casual, use emojis, be encouraging but honest. Keep it under 120 words. Don't use bullet points, just natural flowing text.

Mood entries:
${moodText}

Give insights on: overall mood trend, best/worst moments, and one actionable tip.`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.8,
    }),
  })

  const data = await response.json()
  const summary = data.choices?.[0]?.message?.content || 'Could not generate summary.'

  return NextResponse.json({ summary })
}