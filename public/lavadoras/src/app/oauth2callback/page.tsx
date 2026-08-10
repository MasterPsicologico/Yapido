'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OAuth2CallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [detail, setDetail] = useState<string>('Procesando autenticación...');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      setStatus('error');
      setDetail(errorDescription || error);
      return;
    }

    if (!code) {
      setStatus('error');
      setDetail('No se recibió código de autorización de Google.');
      return;
    }

    const bridge = (window as any).AndroidAuthBridge;

    if (bridge && typeof bridge.submitAuthCode === 'function') {
      bridge.submitAuthCode(code);
      setStatus('success');
      setDetail('Autenticación completada. Volviendo a la app...');
      setTimeout(() => {
        try {
          window.close();
        } catch {}
      }, 1200);
      return;
    }

    if (bridge && typeof bridge.requestGoogleAuth === 'function') {
      (window as any).dispatchEvent(
        new CustomEvent('android-auth-result', {
          detail: { success: true, code },
        })
      );
      setStatus('success');
      setDetail('Autenticación completada. Volviendo a la app...');
      setTimeout(() => {
        try {
          window.close();
        } catch {}
      }, 1200);
      return;
    }

    setStatus('success');
    setDetail('Autenticación completada. Puedes cerrar esta ventana.');
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        background: '#0f172a',
        color: '#f1f5f9',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: status === 'error' ? '#dc2626' : status === 'success' ? '#16a34a' : '#1d4ed8',
          marginBottom: 24,
          fontSize: 32,
          fontWeight: 700,
        }}
      >
        {status === 'processing' && '⋯'}
        {status === 'success' && '✓'}
        {status === 'error' && '✕'}
      </div>
      <h1 style={{ fontSize: 22, margin: 0, marginBottom: 8 }}>
        {status === 'processing' && 'Procesando...'}
        {status === 'success' && 'Listo'}
        {status === 'error' && 'No se pudo completar'}
      </h1>
      <p style={{ margin: 0, opacity: 0.8, fontSize: 14, maxWidth: 360 }}>{detail}</p>
    </div>
  );
}
