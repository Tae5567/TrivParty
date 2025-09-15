import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthProvider'
import { OnboardingProvider } from "@/contexts/OnboardingProvider";
import { RealtimeProvider } from '@/contexts/RealtimeProvider'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import { ServiceWorkerCleanup } from "@/components/ServiceWorkerCleanup";
import { UserNav } from '@/components/auth/UserNav'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrivParty - Turn Any Content Into Interactive Trivia",
  description: "Generate engaging quiz questions from Wikipedia articles or YouTube videos using AI. Perfect for education, team building, or just having fun with friends!",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="no" />
        <meta name="apple-mobile-web-app-capable" content="no" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Immediate cache clearing and service worker prevention
              (function() {
                // Clear all caches immediately
                if ('caches' in window) {
                  caches.keys().then(function(cacheNames) {
                    cacheNames.forEach(function(cacheName) {
                      caches.delete(cacheName);
                    });
                  });
                }
                
                // Prevent service worker registration
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    registrations.forEach(function(registration) {
                      registration.unregister();
                    });
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerCleanup />
        <ThemeProvider>
          <AuthProvider>
            <OnboardingProvider>
              <RealtimeProvider>
                <div className="min-h-screen bg-background">
                  <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-black">TrivParty</h1>
                      </div>
                      <UserNav />
                    </div>
                  </header>
                  <main>
                    {children}
                  </main>
                </div>
              </RealtimeProvider>
            </OnboardingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
