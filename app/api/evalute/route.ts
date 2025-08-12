import { NextResponse } from 'next/server'

const KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${KEY}`

interface EvaluationQuestion {
  question: string
  answer: string
  score: number
  strengths: string[]
  improvements: string[]
  feedback: string
}

interface EvaluationResult {
  domain: string
  summary: { score: number; avgRating: number }
  questions: EvaluationQuestion[]
  raw?: string
}

export async function POST(req: Request) {
  if (!KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  const { domain, questions, answers }: { domain: string; questions: string[]; answers: string[] } =
    await req.json()

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

    const data: unknown = await resp.json()
    const raw =
      typeof data === 'object' &&
      data !== null &&
      'candidates' in data &&
      Array.isArray((data as any).candidates)
        ? (data as any).candidates?.[0]?.content?.parts?.[0]?.text || ''
        : ''

    let parsed: EvaluationResult | { raw: string }
    try {
      parsed = JSON.parse(raw) as EvaluationResult
    } catch {
      const match = raw.match(/\{[\s\S]*\}$/)
      parsed = match ? (JSON.parse(match[0]) as EvaluationResult) : { raw }
    }

    if ('questions' in parsed && Array.isArray(parsed.questions)) {
      parsed.questions = parsed.questions.map((q, i) => ({
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
