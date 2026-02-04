import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Header } from "@/components/header"
import './globals.css'


const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Friend Frenzy - Anonymous Friend Polls',
  description: 'Create hilarious anonymous polls about your friends. See what people really think with game-show style reveals!',
  generator: 'v0.app',
  themeColor: '#0f0a1a',
  openGraph: {
    title: 'Friend Frenzy',
    description: 'Create hilarious anonymous polls about your friends',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Friend Frenzy',
    description: 'Anonymous polls about your friends',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${_geist.className} antialiased`}>
        <Header />
        {children}
        <Analytics />
      </body>

    </html>
  )
}
