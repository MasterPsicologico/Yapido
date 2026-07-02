'use client';

export default function RecorderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md space-y-4 rounded-lg border border-border bg-card p-6 text-center shadow-lg">
        <h2 className="text-xl font-semibold text-foreground">
          Algo no salió bien en la Grabadora
        </h2>
        <p className="text-sm text-muted-foreground">
          {error?.message ||
            'Ocurrió un error al cargar la página. Por favor, intenta nuevamente.'}
        </p>
        {error?.digest && (
          <p className="text-xs text-muted-foreground/70 italic">
            Código de referencia: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
