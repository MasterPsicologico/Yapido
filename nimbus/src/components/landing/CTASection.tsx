
'use client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const CTASection = () => {
    return (
        <section className="scroll-section p-4">
             <div className="absolute inset-0 -z-10 h-full w-full bg-background">
                <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] opacity-30"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_100%,hsl(var(--accent)/0.15),transparent)]"></div>
            </div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 0.6 }}
                 className="container mx-auto px-4 text-center"
            >
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
                    ¿Listo para empezar tu viaje?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                    Tu camino hacia la claridad y el autoconocimiento comienza con una simple conversación. Nimbus está listo para escucharte.
                </p>
                <div className="mt-8">
                    <Button asChild size="lg" className="rounded-full text-base px-8 py-6 shadow-lg shadow-primary/20 transition-all transform hover:scale-105">
                        <Link href="/c">
                            Empezar a Conversar Ahora
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </motion.div>
        </section>
    )
}
