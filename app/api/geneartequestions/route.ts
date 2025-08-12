import { NextResponse } from 'next/server';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

export async function POST(req: Request) {
  if (!GEMINI_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  const { domain, count = 7 } = await req.json();

  const prompt = `
Return ONLY a raw JSON array with EXACTLY ${count} interview questions for the domain "${domain}".
Do not include markdown, explanations, or code fences. Example: ["q1", "q2", ...]
`;

  try {
    const resp = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // <-- fixed typo here
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 500
        }
      })
    });

    const js = await resp.json();
    let raw = js?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 🛠 Remove ```json or ``` and trim
    raw = raw.replace(/```json|```/gi, '').trim();

    let questions: string[] = [];
    try {
      questions = JSON.parse(raw);
      if (!Array.isArray(questions) || questions.length !== count) {
        throw new Error('Invalid array or wrong length');
      }
    } catch {
      // fallback: split by lines if JSON parse fails
      questions = raw.split(/\n+/).map((s: string) => s.trim().replace(/^[-*]\s*/, '')).filter(Boolean).slice(0, count);
    }

    return NextResponse.json({ questions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
