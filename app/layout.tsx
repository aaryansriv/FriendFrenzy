import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Header } from "@/components/header"
import './globals.css'


const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://friendfrenzy.vercel.app'),
  title: 'Friend Frenzy - Anonymous Friend Frenzies',
  description: 'Create hilarious anonymous frenzies about your friends. See what people really think with game-show style reveals and AI roasts!',
  generator: 'v0.app',
  themeColor: '#0f0a1a',
  openGraph: {
    title: 'Friend Frenzy | The Ultimate Roast Platform',
    description: 'Anonymous frenzies, brutal AI roasts, and squad playlists. Nobody is safe.',
    url: 'https://friendfrenzy.vercel.app',
    siteName: 'Friend Frenzy',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Friend Frenzy',
    description: 'The leaks are out. Create anonymous frenzies about your friends and let the AI roast them.',
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

import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${_geist.className} antialiased`}>
          <Header />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
