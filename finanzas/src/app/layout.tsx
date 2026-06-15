
import type {Metadata} from 'next';
import './globals.css';
import { FinanceProvider } from '@/hooks/use-finance-store';
import { Toaster } from '@/components/ui/toaster';
import { NotificationManager } from '@/components/notification-manager';
import { ModalFixer } from '@/components/modal-fixer';
import { FirebaseClientProvider } from '@/firebase';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AmbientBackground } from '@/components/visual/AmbientBackground';
import { SmoothScroll } from '@/components/visual/SmoothScroll';

export const metadata: Metadata = {
  title: 'Finanzas Inteligentes - Tu Asistente IA',
  description: 'Gestión financiera moderna impulsada por inteligencia artificial multiespecialista.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased overflow-x-hidden">
        <ThemeProvider>
          <AmbientBackground />
          <SmoothScroll />
          <FirebaseClientProvider>
            <FinanceProvider>
              <FirebaseErrorListener />
              <ModalFixer />
              <NotificationManager />
              {children}
              <Toaster />
            </FinanceProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
