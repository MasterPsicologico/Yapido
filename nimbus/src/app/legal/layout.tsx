import { AppLogo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/landing/Footer';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo className="h-7 w-7" />
            <span className="font-bold">Nimbus</span>
          </Link>
          <Button asChild variant="ghost">
             <Link href="/">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Volver a la App
            </Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto max-w-4xl px-4 py-8 sm:py-12 lg:py-16 flex-1">
        <div className="prose prose-lg dark:prose-invert max-w-none">
            {children}
        </div>
      </main>
       <Footer />
    </div>
  );
}
