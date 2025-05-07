import type { Metadata } from 'next'
import './globals.css'
import { AppDataProvider } from '@/context/AppDataContext'
import { UserProvider } from "@/context/UserContext";
import 'react-toastify/dist/ReactToastify.css'
import { ToastProvider } from '@/components/ToastProvider'

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
            <ToastProvider />
          </AppDataProvider>
        </UserProvider>
      </body>
    </html>
  )
}

