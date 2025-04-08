import type { Metadata } from 'next'
import './globals.css'
import { PlanesProvider } from '@/context/PlanesContext'

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
      <body>
        <PlanesProvider>
          {children}
        </PlanesProvider>
      </body>
    </html>
  )
}

