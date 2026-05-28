'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { motion } from 'framer-motion';
import { BookOpen, Search, Link as LinkIcon, Sparkles, BrainCircuit } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

const ELSAnimation = () => {
  const text = 'בראשיתבראאלהיםאתהשמיםואת'.split('');
  const skip = 5;
  const word = 'אהשמ'; // Example word, might not be real

  return (
    <div className="flex flex-wrap font-code text-lg leading-7 p-2 bg-background/50 rounded-md border">
      {text.map((char, index) => {
        const isSpaced = index > 0 && index % 10 === 0;
        const isPartOfWord = (index % skip === 0) && (index/skip < word.length);

        return (
          <motion.span
            key={index}
            initial={{ opacity: 0.5 }}
            animate={{
              opacity: isPartOfWord ? 1 : 0.5,
              color: isPartOfWord ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              scale: isPartOfWord ? [1, 1.3, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              delay: isPartOfWord ? (index / skip) * 0.3 + 1 : 0,
              repeat: isPartOfWord ? Infinity : 0,
              repeatDelay: 3,
            }}
            className={isSpaced ? 'ml-2' : ''}
          >
            {char}
          </motion.span>
        );
      })}
    </div>
  );
};


const MatrixAnimation = () => {
    return (
        <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <p className="font-code text-lg">...בראשיתברא...</p>
            <ArrowRightIcon className="h-6 w-6 shrink-0" />
            <div className="grid grid-cols-3 gap-1 font-code p-2 bg-background/50 border rounded-md">
                {'בראשיתבר'.split('').map((char, i) => <span key={i} className="flex items-center justify-center w-6 h-6">{char}</span>)}
            </div>
        </div>
    )
}

const carouselItems = [
  {
    icon: BookOpen,
    title: 'La Teoría: Códigos Ocultos',
    content: (
      <>
        <p className="mb-4">
          La idea, popularizada por el libro "El Código Secreto de la Biblia" de Michael Drosnin, postula que el texto de la Torá contiene información oculta en secuencias de letras equidistantes (ELS).
        </p>
        <ELSAnimation />
        <p className="text-xs text-muted-foreground mt-2">Animación: Buscando una palabra con un salto de 5 letras.</p>
      </>
    ),
  },
  {
    icon: Search,
    title: 'La Matriz: Cruce de Destinos',
    content: (
      <>
        <p className="mb-4">
          Cuando una palabra clave es encontrada, el texto a su alrededor se organiza en una matriz bidimensional. Esto a menudo revela otras palabras y conceptos relacionados que se cruzan, creando un "tapiz" de significados.
        </p>
        <MatrixAnimation />
        <p className="text-xs text-muted-foreground mt-2">Visualización: El texto lineal se convierte en una parrilla para el análisis.</p>
      </>
    ),
  },
  {
    icon: BrainCircuit,
    title: 'Nimbus: Un Espejo Psicológico',
    content: (
       <>
        <p className="mb-4">
          En Nimbus, no usamos el Oráculo para predecir el futuro, sino como una herramienta de introspección. Lo vemos como un <strong>"Test de Rorschach Cósmico"</strong>. Las conexiones y patrones que encuentras son un reflejo de tu propia psique.
        </p>
        <div className="space-y-2">
            <Badge variant="secondary">Sincronicidad Junguiana</Badge>
            <Badge variant="secondary">Proyección Psicológica</Badge>
            <Badge variant="secondary">Arquetipos Universales</Badge>
        </div>
       </>
    ),
  },
];


export default function InfoCarousel() {
  return (
    <div className="mb-12">
    <Carousel className="w-full max-w-4xl mx-auto">
      <CarouselContent>
        {carouselItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card className="bg-card/50">
                  <CardContent className="flex flex-col md:flex-row items-center justify-center p-6 gap-6 md:gap-8">
                    <div className="flex-shrink-0 text-center md:text-left">
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 w-fit mx-auto md:mx-0">
                            <Icon className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mt-3">{item.title}</h3>
                    </div>
                    <Separator orientation="vertical" className="h-20 hidden md:block" />
                    <Separator orientation="horizontal" className="w-24 my-4 md:hidden" />
                    <div className="text-sm text-muted-foreground max-w-md text-center md:text-left">
                        {item.content}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
    </div>
  );
}


function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
