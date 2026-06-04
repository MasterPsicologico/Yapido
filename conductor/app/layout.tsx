import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from './providers';
import { FirebaseBootstrap } from './bootstrap';
import { Splash } from '@/components/layout/Splash';

export const metadata: Metadata = {
  title: 'Yapido Movilidad',
  description: 'Tu viaje en moto o auto, en minutos. Aguachica, Cesar.',
  manifest: '/m-static/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f8fafc',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <head>
        <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css" />
        <link
          rel="stylesheet"
          href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-directions/v4.3.1/mapbox-gl-directions.css"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#f8fafc" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased pb-safe">
        <FirebaseBootstrap>
          <AuthProvider>
            <Splash>{children}</Splash>
          </AuthProvider>
        </FirebaseBootstrap>
      </body>
    </html>
  );
}

