'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResultPage() {
  const [report, setReport] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const raw = localStorage.getItem('ai_interview_report')
    if (!raw) { router.push('/'); return }
    try {
      let parsed = JSON.parse(raw)

      // If we got a wrapped markdown JSON string, parse it again
      if (parsed.raw && typeof parsed.raw === 'string') {
        let clean = parsed.raw
          .replace(/```json\s*/i, '') // remove starting ```json
          .replace(/```$/i, '')       // remove ending ```
          .trim()
        parsed = JSON.parse(clean)
      }

      setReport(parsed)
    } catch {
      setReport(null)
    }
  }, [router])

  if (!report) return <div className="text-center py-20">Loading...</div>

  const summary = report.summary || { score: '—', avgRating: '—' }
  const questions = Array.isArray(report.questions) ? report.questions : []

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-block rounded-full bg-indigo-100 p-4 mb-3">🏆</div>
        <h2 className="text-2xl font-bold">Interview Complete!</h2>
        <p className="text-slate-500">Results for {report.domain || '—'}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-3xl font-bold">{summary.score ?? '—'}%</div>
            <div className="text-slate-500">Overall Score</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-medium">{summary.avgRating ?? '—'}/10</div>
            <div className="text-slate-500">Average Rating</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center text-slate-500">No questions found.</div>
        ) : (
          questions.map((q: any, i: number) => (
            <div className="bg-white p-4 rounded-xl shadow flex justify-between" key={i}>
              <div>
                <div className="text-sm text-slate-500">Q{i + 1}</div>
                <div className="font-semibold">{q?.question || '—'}</div>
                <div className="mt-2 text-slate-600">Your answer: {q?.answer ?? '—'}</div>
                <div className="mt-2 text-slate-500">Feedback: {q?.feedback ?? 'No feedback'}</div>
                <div className="mt-2">
                  <strong>Strengths:</strong>
                  <ul className="list-disc ml-6">
                    {(q?.strengths ?? []).length === 0 ? (
                      <li>—</li>
                    ) : (
                      (q.strengths || []).map((s: string, idx: number) => <li key={idx}>{s}</li>)
                    )}
                  </ul>
                  <strong className="mt-2 block">Improvements:</strong>
                  <ul className="list-disc ml-6">
                    {(q?.improvements ?? []).length === 0 ? (
                      <li>—</li>
                    ) : (
                      (q.improvements || []).map((s: string, idx: number) => <li key={idx}>{s}</li>)
                    )}
                  </ul>
                </div>
              </div>
              <div className="text-2xl font-bold">{q?.score ?? '—'}/10</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
