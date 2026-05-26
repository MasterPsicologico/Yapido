"use client"

import React, { useState } from 'react';
import { X, Delete, Percent, Divide, Minus, Plus, Equal, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalculatorOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol: string;
}

export function CalculatorOverlay({ isOpen, onClose }: CalculatorOverlayProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isNewNumber, setIsNewNumber] = useState(true);

  if (!isOpen) return null;

  const handleNumber = (num: string) => {
    if (isNewNumber) {
      if (num === '.') {
        setDisplay('0.');
      } else {
        setDisplay(num);
      }
      setIsNewNumber(false);
    } else {
      if (num === '.' && display.includes('.')) return;
      if (display === '0' && num !== '.') {
        setDisplay(num);
      } else {
        if (display.length < 12) {
          setDisplay(display + num);
        }
      }
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setIsNewNumber(true);
  };

  const calculate = () => {
    try {
      const fullEquation = equation + display;
      const sanitized = fullEquation.replace(/X/g, '*').replace(/[^- \d/*+.]/g, '');
      const result = eval(sanitized);
      
      let formattedResult = Number(result.toFixed(8)).toString();
      if (formattedResult.length > 12) {
        formattedResult = result.toPrecision(8);
      }
      
      setDisplay(formattedResult);
      setEquation('');
      setIsNewNumber(true);
    } catch (e) {
      setDisplay('Error');
      setEquation('');
      setIsNewNumber(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
    setIsNewNumber(true);
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setIsNewNumber(true);
    }
  };

  const toggleSign = () => {
    if (display === '0') return;
    setDisplay((parseFloat(display) * -1).toString());
  };

  const handlePercent = () => {
    setDisplay((parseFloat(display) / 100).toString());
  };

  const CalcButton = ({ 
    children, 
    onClick, 
    className, 
    variant = "number" 
  }: { 
    children: React.ReactNode, 
    onClick: () => void, 
    className?: string,
    variant?: "number" | "operator" | "action" | "equal"
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "h-14 sm:h-16 w-full flex items-center justify-center text-2xl font-black transition-all rounded-2xl relative",
        "shadow-[0_4px_0_0_rgba(0,0,0,0.15)] active:shadow-none active:translate-y-[2px]",
        variant === "number" && "bg-white text-primary hover:bg-muted/10 border border-muted/20 shadow-muted/50",
        variant === "operator" && "bg-[#FF9500] text-white hover:bg-[#e68600] shadow-[#cc7700]/50",
        variant === "action" && "bg-muted/40 text-primary hover:bg-muted/50 shadow-muted/30",
        variant === "equal" && "bg-primary text-white hover:bg-primary/90 shadow-primary/40",
        className
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
      <div className="sr-only">
        <h2>Calculadora Financiera</h2>
      </div>

      <div className="shrink-0 h-14 border-b flex items-center justify-between px-6 bg-primary text-white">
        <div className="flex items-center gap-3">
          <div className="bg-[#FF9500] p-1 rounded-md">
            <Hash className="w-3 h-3 text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Calculadora de Precisión</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="text-white hover:bg-white/10 rounded-full h-8 w-8 transition-colors"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col justify-end p-8 bg-gradient-to-b from-primary/5 to-white overflow-hidden pb-12">
        <div className="w-full max-w-md mx-auto flex flex-col items-end px-4">
          <div className="text-xs font-black text-muted-foreground/60 mb-2 h-5 tracking-widest font-mono uppercase overflow-hidden text-right">
            {equation || "Listo para operar"}
          </div>
          <div className="w-full flex justify-end items-center overflow-hidden h-24">
            <span className="text-6xl sm:text-7xl font-black text-primary tracking-tighter break-all text-right leading-none">
              {display}
            </span>
          </div>
        </div>
      </div>

      <div className="shrink-0 p-6 bg-muted/5 grid grid-cols-4 gap-3 pb-12 sm:pb-8 max-w-md mx-auto w-full">
        <CalcButton onClick={clear} variant="action" className="text-destructive text-xl">AC</CalcButton>
        <CalcButton onClick={toggleSign} variant="action" className="text-xl">+/-</CalcButton>
        <CalcButton onClick={handlePercent} variant="action" className="text-xl">%</CalcButton>
        <CalcButton onClick={() => handleOperator('/')} variant="operator">
          <Divide className="w-6 h-6 stroke-[3px]" />
        </CalcButton>

        <CalcButton onClick={() => handleNumber('7')}>7</CalcButton>
        <CalcButton onClick={() => handleNumber('8')}>8</CalcButton>
        <CalcButton onClick={() => handleNumber('9')}>9</CalcButton>
        <CalcButton onClick={() => handleOperator('X')} variant="operator">
          <X className="w-6 h-6 stroke-[3px]" />
        </CalcButton>

        <CalcButton onClick={() => handleNumber('4')}>4</CalcButton>
        <CalcButton onClick={() => handleNumber('5')}>5</CalcButton>
        <CalcButton onClick={() => handleNumber('6')}>6</CalcButton>
        <CalcButton onClick={() => handleOperator('-')} variant="operator">
          <Minus className="w-6 h-6 stroke-[3px]" />
        </CalcButton>

        <CalcButton onClick={() => handleNumber('1')}>1</CalcButton>
        <CalcButton onClick={() => handleNumber('2')}>2</CalcButton>
        <CalcButton onClick={() => handleNumber('3')}>3</CalcButton>
        <CalcButton onClick={() => handleOperator('+')} variant="operator">
          <Plus className="w-6 h-6 stroke-[3px]" />
        </CalcButton>

        <CalcButton onClick={() => handleNumber('0')}>0</CalcButton>
        <CalcButton onClick={() => handleNumber('.')}>.</CalcButton>
        <CalcButton onClick={backspace} variant="action">
          <Delete className="w-5 h-5 text-destructive" />
        </CalcButton>
        <CalcButton onClick={calculate} variant="equal">
          <Equal className="w-7 h-7 stroke-[3px]" />
        </CalcButton>
      </div>
    </div>
  );
}
