import type { Metadata } from 'next'
import './globals.css'
import { AppDataProvider } from '@/context/AppDataContext'
import { UserProvider } from "@/context/UserContext";

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
        <UserProvider>
          <AppDataProvider>
            {children}
          </AppDataProvider>
        </UserProvider>
      </body>
    </html>
  )
}

