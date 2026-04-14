import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/Providers';
import Navbar from '@/components/layout/Navbar';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'NeuroVault - AI Personal Knowledge Base',
  description: 'Your AI-powered second brain. Store notes, PDFs, and YouTube transcripts. Ask questions and get grounded answers using RAG.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="bg-white dark:bg-gray-950 transition-colors duration-300 antialiased font-sans selection:bg-blue-100 dark:selection:bg-blue-900/40 selection:text-blue-900 dark:selection:text-blue-100">
        <Providers>
          <div className="relative min-h-screen">
            <Navbar />
            <main className="pt-20">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
