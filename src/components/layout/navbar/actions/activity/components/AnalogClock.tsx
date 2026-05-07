"use client";

import { cn } from '@/lib/utils';

interface AnalogClockProps {
  hours: number;
  minutes: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showNumbers?: boolean;
}

const SIZES = {
  sm: 32,
  md: 44,
  lg: 56
};

export function AnalogClock({ hours, minutes, size = 'md', className, showNumbers = false }: AnalogClockProps) {
  const dimensions = SIZES[size];
  
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  const minuteAngle = minutes * 6;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: dimensions, height: dimensions }}>
      <svg 
        width={dimensions} 
        height={dimensions} 
        viewBox="0 0 40 40" 
        className="absolute inset-0"
      >
        <circle 
          cx="20" 
          cy="20" 
          r="18" 
          fill="white" 
          stroke="currentColor" 
          strokeWidth="1.5"
          className="text-slate-200"
        />
        
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
          const isMainHour = i % 3 === 0;
          return (
            <line
              key={angle}
              x1="20"
              y1="4"
              x2="20"
              y2={isMainHour ? "8" : "6"}
              stroke="currentColor"
              strokeWidth={isMainHour ? 1.5 : 1}
              strokeLinecap="round"
              className={isMainHour ? "text-slate-600" : "text-slate-300"}
              transform={`rotate(${angle} 20 20)`}
            />
          );
        })}
        
        <line
          x1="20"
          y1="20"
          x2="20"
          y2="11"
          stroke="#0f172a"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${hourAngle} 20 20)`}
        />
        
        <line
          x1="20"
          y1="20"
          x2="20"
          y2="6"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle} 20 20)`}
        />
        
        <circle cx="20" cy="20" r="2" fill="#0f172a" />
      </svg>
    </div>
  );
}