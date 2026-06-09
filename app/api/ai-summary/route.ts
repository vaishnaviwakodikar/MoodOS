import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { entries } = await req.json()

    if (!entries || entries.length === 0) {
      return NextResponse.json({ summary: 'No mood entries found to reflect on.' })
    }

    const entryLines = entries
      .slice(0, 20)
      .map((e: { mood: string; score: number; note: string | null; created_at: string }) =>
        `- ${e.mood} (score: ${e.score})${e.note ? `: "${e.note}"` : ''} on ${new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      )
      .join('\n')

    const prompt = `You are a warm, gentle journaling companion. Based on the following mood entries, write a soft and empathetic reflection (3–4 sentences). Notice patterns, celebrate small wins, and offer a gentle encouragement. Write in second person ("you"), keep it poetic and tender — like a letter from a caring friend. Do not use bullet points or headers.

Mood entries:
${entryLines}`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.85,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Groq error:', err)
      return NextResponse.json({ summary: 'Could not generate reflection right now. Try again shortly.' }, { status: 500 })
    }

    const data = await res.json()
    const summary = data.choices?.[0]?.message?.content?.trim() ?? 'Nothing to reflect on yet.'

    return NextResponse.json({ summary })
  } catch (err) {
    console.error('ai-summary error:', err)
    return NextResponse.json({ summary: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}