import type {Metadata} from 'next';
import localFont from 'next/font/local';
import './globals.css'; // Global styles



const customFont = localFont({
  src: './fonts/Sekaiwo.ttf', // <-- Make sure this matches your file name exactly
  variable: '--font-japanese',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Soumik Halder | Portfolio',
  description: 'Portfolio of Soumik Halder, AI Prompt Engineer & Developer',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
      <html lang="en" className={`${customFont.variable} dark`}>
      <body className="font-japanese bg-black text-white overflow-hidden" suppressHydrationWarning>{children}</body>
      </html>
  );
}
