'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface CreatorCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
}

export default function CreatorCard({ title, description, icon: Icon, onClick }: CreatorCardProps) {
  return (
    <Card 
        className="h-full flex flex-col group cursor-pointer bg-card/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
        onClick={onClick}
    >
      <CardHeader>
        <div className="p-3 bg-primary/10 rounded-lg w-fit border border-primary/20 mb-4 group-hover:scale-110 transition-transform">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription>{description}</CardDescription>
      </CardContent>
      <div className="p-4 pt-0">
          <div className="flex items-center text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Comenzar a Crear</span>
              <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform"/>
          </div>
      </div>
    </Card>
  );
}
