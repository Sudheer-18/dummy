import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // This route receives raw body or form-data. For a production app, use a storage service.
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      // In App Router, parsing multipart is non-trivial; for demo return ok
      return NextResponse.json({ ok: true, note: 'multipart received (not parsed in demo)' })
    } else {
      const buf = await req.arrayBuffer()
      return NextResponse.json({ ok: true, size: buf.byteLength })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
