import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from '@/components/providers'
import "./globals.css"
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'
import GlobalSidebar from '@/components/layout/global-sidebar-new'
import { TopBar } from '@/components/layout/top-bar'
import { ContentWrapper } from "@/components/layout/ContentWrapper"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Voxly - AI Communication Coach",
  description: "Improve your communication skills with AI-powered coaching",
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          <div className="relative min-h-screen">
            <GlobalSidebar />
            <div className="flex flex-col min-h-screen">
              <TopBar />
              <ContentWrapper>
                <main className="flex-1">
                  {children}
                </main>
              </ContentWrapper>
            </div>
          </div>
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  )
}