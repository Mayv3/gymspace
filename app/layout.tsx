import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GYMSPACE',
  description: 'GymSpace y el club',
  generator: 'N',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
       <link rel="icon" href="/Gymspace-logo-png.png" type="image/png" />
      </head>
      <body>{children}</body>
    </html>
  )
}

