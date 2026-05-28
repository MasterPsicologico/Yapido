
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppLogo } from '@/components/logo';
import { Lock, Sparkles } from 'lucide-react';
import { useAuth } from '@/firebase';

interface AuthRequiredPanelProps {
    onClose: () => void;
}

export default function AuthRequiredPanel({ onClose }: AuthRequiredPanelProps) {
    const { signInWithGoogle } = useAuth();
    
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md"
            >
                <Card className="bg-card/90 border-transparent overflow-hidden relative">
                     <div className="animated-border" style={{ animationDuration: '8s' }} />
                     <div className="p-8 text-center relative">
                        <div className="mb-6 flex flex-col items-center">
                            <div className="p-3 bg-primary/10 rounded-full border border-primary/20 mb-4">
                                <Lock className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                                Desbloquea el Espejo de tu Mente
                            </h2>
                        </div>
                        <p className="text-muted-foreground mb-8">
                            Para acceder a tu confidente IA y construir el cianotipo de tu psique, necesitas una llave. Inicia sesión para desbloquear un análisis profundo y personalizado.
                        </p>
                        <Button
                            size="lg"
                            className="w-full rounded-full text-base px-8 py-6 shadow-lg shadow-primary/20 transition-all transform hover:scale-105"
                            onClick={signInWithGoogle}
                        >
                            <Sparkles className="mr-2 h-5 w-5" />
                            Iniciar Sesión con Google
                        </Button>
                     </div>
                </Card>
            </motion.div>
        </motion.div>
    );
}
