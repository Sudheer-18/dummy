'use client'
import React, { useEffect, useRef, useState } from 'react'
import CameraPanel from '../components/Camerapanel'
import QuestionCard from '../components/Questionscard'
import ProgressBar from '../components/Prograssbar'
import { useSearchParams, useRouter } from 'next/navigation'

declare global {
  interface Window { webkitSpeechRecognition: any }
}

export default function InterviewPage() {
  const searchParams = useSearchParams()
  const domain = searchParams?.get('domain') || 'Product Management'
  const [questions, setQuestions] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const router = useRouter()
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    fetch('/api/geneartequestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, count: 7 })
    })
      .then(r => r.json())
      .then(j => {
        const qs = j.questions || ['Tell me about yourself', 'What is your biggest strength?']
        setQuestions(qs)
        setAnswers(Array(qs.length).fill(''))
      })
      .catch(e => {
        console.error(e)
        setQuestions([])
      })
  }, [domain])

  // Setup SpeechRecognition (live STT)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const rec = new SpeechRecognition()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.onresult = (ev: any) => {
      let final = ''
      let interim = ''
      for (let i = 0; i < ev.results.length; i++) {
        const res = ev.results[i]
        if (res.isFinal) final += res[0].transcript
        else interim += res[0].transcript
      }
      setTranscript(final + interim)
    }
    rec.onend = () => { setListening(false) }
    recognitionRef.current = rec
  }, [])

  // Auto-sync transcript into answers
  useEffect(() => {
    if (transcript && transcript.trim()) {
      setAnswers(prev => {
        const copy = [...prev]
        copy[currentIndex] = transcript
        return copy
      })
    }
  }, [transcript, currentIndex])

  function toggleListening() {
    if (!recognitionRef.current) {
      alert('SpeechRecognition not supported in this browser.')
      return
    }
    if (!listening) {
      recognitionRef.current.start()
      setListening(true)
    } else {
      recognitionRef.current.stop()
      setListening(false)
    }
  }

  function onAudioReady(blob: Blob, url: string) {
    setAudioBlob(blob)
  }

  function onVideoReady(blob: Blob, url: string) {
    setVideoBlob(blob)
  }

  function updateAnswerForCurrent(text: string) {
    const copy = [...answers]
    copy[currentIndex] = text
    setAnswers(copy)
    setTranscript('') // clear transcript if typing
  }

  async function handleNext() {
    if (currentIndex < questions.length - 1) {
      setTranscript('')
      setCurrentIndex(currentIndex + 1)
    } else {
      const payload = {
        domain,
        questions,
        answers: answers.map((a, i) => a || (i === currentIndex ? transcript : ''))
      }
      const res = await fetch('/api/evalute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      localStorage.setItem(
        'ai_interview_report',
        JSON.stringify({ ...json, domain, questions, answers: payload.answers })
      )
      router.push('/result')
    }
  }

  async function uploadIfAny() {
    if (videoBlob) {
      const form = new FormData()
      form.append('file', videoBlob, 'video.webm')
      await fetch('/api/upload', { method: 'POST', body: form })
    }
    if (audioBlob) {
      const form = new FormData()
      form.append('file', audioBlob, 'audio.webm')
      await fetch('/api/upload', { method: 'POST', body: form })
    }
  }

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside className="col-span-1">
        <CameraPanel onAudioReady={onAudioReady} onVideoReady={onVideoReady} />
        <div className="mt-4 flex gap-2">
          <button
            onClick={toggleListening}
            className={`px-3 py-2 rounded ${listening ? 'bg-red-500 text-white' : 'bg-slate-100'}`}
          >
            {listening ? 'Stop Listening' : 'Start Speaking (STT)'}
          </button>
          <button
            onClick={() => document.documentElement.requestFullscreen?.()}
            className="px-3 py-2 rounded bg-slate-100"
          >
            Fullscreen
          </button>
        </div>
        <div className="mt-3 text-xs text-slate-500">Transcript (live):</div>
        <div className="bg-white p-2 rounded mt-1 min-h-[80px] text-sm">
          {transcript || <span className="text-slate-400">No speech detected yet.</span>}
        </div>
      </aside>

      <section className="col-span-1 lg:col-span-3 space-y-6">
        <ProgressBar current={currentIndex + 1} total={Math.max(1, questions.length)} />
        <div>
          {questions[currentIndex] ? (
            <QuestionCard question={questions[currentIndex]} />
          ) : (
            <div>Loading question...</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h4 className="font-semibold mb-2">Your Answer</h4>
          <textarea
            className="w-full h-40 border rounded p-3 mb-3"
            placeholder="Type your answer or use speech-to-text"
            value={answers[currentIndex] || ''}
            onChange={(e) => updateAnswerForCurrent(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-500">
              Tip: Use the STT button to speak; then edit/transcribe before proceeding.
            </div>
            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-indigo-400 to-violet-400 text-white px-6 py-2 rounded"
            >
              {currentIndex < questions.length - 1 ? 'Next Question →' : 'Finish Interview'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
