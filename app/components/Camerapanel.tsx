'use client'
import React, { useEffect, useRef, useState } from 'react'

type Props = {
  onVideoReady?: (blob: Blob, url: string) => void
  onAudioReady?: (blob: Blob, url: string) => void
}

export default function CameraPanel({ onVideoReady, onAudioReady }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [camStream, setCamStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [videoRecorder, setVideoRecorder] = useState<MediaRecorder | null>(null)
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null)
  const videoChunks = useRef<Blob[]>([])
  const audioChunks = useRef<Blob[]>([])
  const [recording, setRecording] = useState(false)

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640 }, audio: true })
      setCamStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch (e) {
      console.error('Camera error', e)
      alert('Camera access denied or unavailable.')
    }
  }

  function startRecording() {
    if (!camStream) return alert('Start camera first')
    // Record combined video+audio for video file
    const combinedTracks = new MediaStream([...camStream.getVideoTracks(), ...camStream.getAudioTracks()])
    const vr = new MediaRecorder(combinedTracks, { mimeType: 'video/webm; codecs=vp8,opus' })
    videoChunks.current = []
    vr.ondataavailable = (e) => e.data.size && videoChunks.current.push(e.data)
    vr.onstop = () => {
      const blob = new Blob(videoChunks.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      onVideoReady?.(blob, url)
    }
    vr.start()
    setVideoRecorder(vr)

    // Also record audio-only for STT
    const ar = new MediaRecorder(new MediaStream(camStream.getAudioTracks()), { mimeType: 'audio/webm' })
    audioChunks.current = []
    ar.ondataavailable = (e) => e.data.size && audioChunks.current.push(e.data)
    ar.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
      const url = URL.createObjectURL(blob)
      onAudioReady?.(blob, url)
    }
    ar.start()
    setAudioRecorder(ar)
    setRecording(true)
  }

  function stopRecording() {
    videoRecorder?.stop()
    audioRecorder?.stop()
    setRecording(false)
  }

  async function startScreenShare() {
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      setScreenStream(s)
      // Optionally open small preview window
      // You can merge this stream elsewhere if you want to record screens too
    } catch (e) {
      console.error('Screen share failed', e)
      alert('Screen share failed or cancelled.')
    }
  }

  useEffect(() => {
    startCamera()
    return () => {
      camStream?.getTracks().forEach(t => t.stop())
      screenStream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-xl p-3 shadow">
        <div className="bg-slate-100 rounded overflow-hidden">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-48 object-cover" />
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {!recording ? (
            <button onClick={startRecording} className="bg-blue-600 text-white px-4 py-2 rounded">Start Recording</button>
          ) : (
            <button onClick={stopRecording} className="bg-red-500 text-white px-4 py-2 rounded">Stop Recording</button>
          )}

          <button onClick={startScreenShare} className="bg-slate-100 px-4 py-2 rounded">Start Screen Share</button>

          <div className="text-xs text-slate-400">Tip: recordings are kept locally and can be uploaded optionally.</div>
        </div>
      </div>
    </div>
  )
}
