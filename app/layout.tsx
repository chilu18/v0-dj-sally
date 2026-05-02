import type { Metadata, Viewport } from 'next'
import { Figtree, Grandstander } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const figtree = Figtree({ 
  subsets: ["latin"],
  variable: "--font-figtree",
});

const grandstander = Grandstander({ 
  subsets: ["latin"],
  variable: "--font-grandstander",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
}

export const metadata: Metadata = {
  title: 'DJ Sally',
  description: 'Professional DJ control interface for Raspberry Pi hardware',
  generator: 'v0.app',
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
    <html lang="en" className={`${figtree.variable} ${grandstander.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
