'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mic, Square, Pause, Play, Trash2, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type RecordingStatus = 'idle' | 'recording' | 'paused' | 'transcribing' | 'done';

interface RecordingControlsProps {
    status: RecordingStatus;
    onStart: () => void;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    onClear: () => void;
}

const iconVariants = {
  hidden: { scale: 0.5, opacity: 0, rotate: -45 },
  visible: { scale: 1, opacity: 1, rotate: 0 },
  exit: { scale: 0.5, opacity: 0, rotate: 45 },
};

const MotionButton = motion(Button);

export default function RecordingControls({ status, onStart, onPause, onResume, onStop, onClear }: RecordingControlsProps) {

  const renderMainButton = () => {
    const disabled = status === 'transcribing';

    switch (status) {
      case 'idle':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
                <MotionButton
                    type="button"
                    key="start"
                    variants={iconVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="h-10 w-10 rounded-full"
                    size="icon"
                    onClick={onStart}
                    disabled={disabled}
                >
                    <Mic className="h-5 w-5" />
                </MotionButton>
            </TooltipTrigger>
            <TooltipContent><p>Empezar a Grabar</p></TooltipContent>
          </Tooltip>
        );
      case 'recording':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
                 <MotionButton
                    type="button"
                    key="pause"
                    variants={iconVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="h-10 w-10 rounded-full bg-amber-500 hover:bg-amber-600"
                    size="icon"
                    onClick={onPause}
                    disabled={disabled}
                >
                    <Pause className="h-5 w-5" />
                </MotionButton>
            </TooltipTrigger>
             <TooltipContent><p>Pausar Grabación</p></TooltipContent>
          </Tooltip>
        );
      case 'paused':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
                 <MotionButton
                    type="button"
                    key="resume"
                    variants={iconVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="h-10 w-10 rounded-full"
                    size="icon"
                    onClick={onResume}
                    disabled={disabled}
                >
                    <Play className="h-5 w-5" />
                </MotionButton>
            </TooltipTrigger>
            <TooltipContent><p>Reanudar Grabación</p></TooltipContent>
          </Tooltip>
        );
       case 'transcribing':
        return (
            <MotionButton
                disabled
                type="button"
                key="processing"
                variants={iconVariants}
                initial="hidden" animate="visible" exit="exit"
                className="h-10 w-10 rounded-full"
                size="icon"
            >
                <Loader2 className="h-5 w-5 animate-spin" />
            </MotionButton>
        );
      case 'done':
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <MotionButton
                        type="button"
                        key="clear"
                        variants={iconVariants}
                        initial="hidden" animate="visible" exit="exit"
                        className="h-10 w-10 rounded-full bg-destructive text-white hover:bg-destructive/90"
                        size="icon"
                        onClick={onClear}
                        disabled={disabled}
                    >
                        <Trash2 className="h-5 w-5" />
                    </MotionButton>
                </TooltipTrigger>
                <TooltipContent><p>Limpiar Grabación</p></TooltipContent>
            </Tooltip>
        );
      default:
        return null;
    }
  };

  const renderStopButton = () => {
    if(status === 'paused' || status === 'recording') {
       return (
         <Tooltip>
            <TooltipTrigger asChild>
                <MotionButton
                    type="button"
                    key="stop"
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="h-10 w-10 rounded-full bg-red-500 text-white hover:bg-red-600"
                    size="icon"
                    onClick={onStop}
                >
                    <Square className="h-5 w-5" />
                </MotionButton>
            </TooltipTrigger>
            <TooltipContent><p>Finalizar Grabación</p></TooltipContent>
         </Tooltip>
       )
    }
    return null;
  }

  return (
    <TooltipProvider>
      <div className="relative flex items-center justify-center h-10 gap-2">
         <AnimatePresence mode="wait">
            {renderMainButton()}
        </AnimatePresence>
        <AnimatePresence>
            {renderStopButton()}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
