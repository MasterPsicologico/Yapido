
'use client';

import { motion } from 'framer-motion';
import * as LucideIcons from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

const iconMap = {
    BrainCircuit: LucideIcons.BrainCircuit,
    Dumbbell: LucideIcons.Dumbbell,
    Star: LucideIcons.Star,
    BookOpen: LucideIcons.BookOpen,
    UserCircle: LucideIcons.UserCircle,
    Briefcase: LucideIcons.Briefcase,
    Atom: LucideIcons.Atom,
    FileText: LucideIcons.FileText,
};

type IconName = keyof typeof iconMap;

interface FeatureCardProps {
    icon: IconName;
    title: string;
    description: string;
    href: string;
    index: number;
    imageUrl: string;
}

export const FeatureCard = ({ icon: iconName, title, description, href, index, imageUrl }: FeatureCardProps) => {
    
    const Icon = iconMap[iconName] || LucideIcons.HelpCircle;

    return (
        <section className="scroll-section p-4">
             <Image
                src={imageUrl}
                alt={title}
                layout="fill"
                objectFit="cover"
                className="absolute inset-0 -z-20"
                priority={index < 2}
             />
             <div className="absolute inset-0 bg-black/60 -z-10"></div>
             
             <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 0.6 }}
                className="relative container mx-auto px-4 text-center"
             >
                <div className="p-4 rounded-2xl w-fit mx-auto border mb-6 bg-primary/10 border-primary/20">
                    <Icon className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-gold-gleam leading-tight">
                    {title}
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-white/80">
                    {description}
                </p>
                <div className="mt-10 flex justify-center items-center gap-4">
                    <Button asChild size="lg" className="rounded-full text-base px-8 py-6">
                        <Link href={href}>
                           Explorar Módulo
                           <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </motion.div>
        </section>
    );
};
