import './globals.css'
import React from 'react'
import Header from './components/Header'

export const metadata = {
  title: 'AI Interview Assistant',
  description: 'AI-powered interview practice with Gemini'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="min-h-screen p-6 md:p-10">{children}</main>
      </body>
    </html>
  )
}
