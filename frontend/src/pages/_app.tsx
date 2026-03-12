import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useEffect, useState } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    // Some injected scripts / older runtimes may not support crypto.randomUUID().
    // Provide a safe polyfill to prevent client-side crashes.
    const c: any = (globalThis as any).crypto;
    if (!c) return;
    if (typeof c.randomUUID === 'function') return;

    c.randomUUID = () => {
      const bytes = new Uint8Array(16);
      if (typeof c.getRandomValues === 'function') {
        c.getRandomValues(bytes);
      } else {
        for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
      }
      // RFC 4122 version 4
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
