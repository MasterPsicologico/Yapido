
'use client';
import { AppLogo } from '@/components/logo';
import Link from 'next/link';

export const Footer = () => {
    return (
        <footer className="scroll-section bg-background">
            <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-2 mb-4">
                    <AppLogo className="w-8 h-8" />
                    <span className="text-xl font-bold">Nimbus</span>
                </div>
                 <div className="flex gap-4 sm:gap-6 text-sm text-muted-foreground mb-6">
                    <Link href="/legal/about" className="hover:text-foreground">Quiénes Somos</Link>
                    <Link href="/legal/terms" className="hover:text-foreground">Términos</Link>
                    <Link href="/legal/privacy" className="hover:text-foreground">Privacidad</Link>
                    <Link href="/legal/contact" className="hover:text-foreground">Contacto</Link>
                </div>
                <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Nimbus. Tu viaje interior comienza aquí.</p>
            </div>
        </footer>
    )
}
