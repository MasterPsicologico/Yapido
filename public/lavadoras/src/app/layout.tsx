
import type {Metadata} from 'next';
import Script from 'next/script';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { ChatNotificationListener } from '@/components/chat/ChatNotificationListener';
import { VisualNotificationListener } from '@/components/notification/VisualNotificationListener';
import { NativeNotificationListener } from '@/components/notification/NativeNotificationListener';
import { CartProvider } from '@/context/CartContext';
import { GlobalOrderChatModal } from '@/components/chat/GlobalOrderChatModal';
import { AutoRatingTrigger } from '@/components/rating/AutoRatingTrigger';
import { AndroidBackButtonHandler } from '@/components/system/AndroidBackButtonHandler';
import {
  initiateGoogleSignIn,
  initiateGoogleSignInWithOneTap,
  __ANDROID_BRIDGE_BUILD_MARKER__,
} from '@/firebase/non-blocking-login-v8';

export const metadata: Metadata = {
  title: 'Yapido.click - Logística y Alquiler de Lavadoras',
  description: 'Especialistas en alquiler, compraventa y mantenimiento de lavadoras en Colombia con Yapido.click.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Side-effect imports para garantizar inclusion del modulo de auth en el chunk inicial
  if (typeof window !== 'undefined') {
    void initiateGoogleSignIn;
    void initiateGoogleSignInWithOneTap;
    void __ANDROID_BRIDGE_BUILD_MARKER__;
  }
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen">
        {/* Solo cargar Google Identity Services si NO es Android APK (evita conflicto con AndroidAuthBridge) */}
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          async
          defer
          onLoad={() => {
            if (typeof window !== 'undefined' && (window as any).AndroidAuthBridge?.requestNativeGoogleAuth) {
              try {
                (window as any).google.accounts.id.cancel();
                console.log('[auth] Anulando GIS porque AndroidAuthBridge está activo');
              } catch (_) {}
            }
          }}
        />
        <FirebaseClientProvider>
          <CartProvider>
            {/* El ChatNotificationListener gestiona audio y toasts */}
            <ChatNotificationListener />
            {/* El VisualNotificationListener gestiona los diálogos inmersivos de pantalla completa */}
            <VisualNotificationListener />
            {/* Gestión de Alertas Nativas para APK (FCM) */}
            <NativeNotificationListener />
            <GlobalOrderChatModal />
            <AutoRatingTrigger />
            <AndroidBackButtonHandler />
            {children}
            <Toaster />
          </CartProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
