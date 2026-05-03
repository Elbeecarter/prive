import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';

export const metadata: Metadata = {
  title: 'Privé — Private Finance on Solana',
  description: 'Privacy-first financial OS powered by MagicBlock PER',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
