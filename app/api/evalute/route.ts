import { NextResponse } from 'next/server'

const KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${KEY}`

export async function POST(req: Request) {
  if (!KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  const { domain, questions, answers } = await req.json()

  const pairs = questions
    .map((q: string, i: number) => `Q: ${q}\nA: ${answers[i] || '—'}`)
    .join('\n\n')

  const prompt = `
You are an expert interview evaluator. For the domain "${domain}", evaluate the following question/answer pairs.
Return ONLY a single valid JSON object with this structure:
{
 "domain": "<domain>",
 "summary": { "score": <overall percent 0-100>, "avgRating": <0-10> },
 "questions": [
   { "question": "<...>", "answer": "<...>", "score": <0-10>, "strengths": ["..."], "improvements": ["..."], "feedback": "<1-2 sentence summary>" }
 ]
}

Now evaluate:
${pairs}
If the answer is correct, give a score accordingly. If no answer or incorrect, score 0. Output must be valid JSON only.
`

  try {
    const resp = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1200
        }
      })
    })

    const data = await resp.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}$/)
      parsed = match ? JSON.parse(match[0]) : { raw }
    }

    if (Array.isArray(parsed?.questions)) {
      parsed.questions = parsed.questions.map((q: any, i: number) => ({
        question: q.question || questions[i],
        answer: q.answer || answers[i] || '',
        score: q.score ?? 0,
        strengths: q.strengths || [],
        improvements: q.improvements || [],
        feedback: q.feedback || ''
      }))
      parsed.domain = parsed.domain || domain
    }
    console.log(parsed)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
