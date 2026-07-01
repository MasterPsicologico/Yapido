'use client';

import { AnimatePresence, motion } from 'framer-motion';
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

const MotionDiv: any = motion.div;

export default function RecordingControls({ status, onStart, onPause, onResume, onStop, onClear }: RecordingControlsProps) {

  const renderMainButton = () => {
    const disabled = status === 'transcribing';

    switch (status) {
      case 'idle':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    key="start"
                    className="dream-rec-btn"
                    onClick={onStart}
                    disabled={disabled}
                >
                    <MotionDiv variants={iconVariants} initial="hidden" animate="visible" exit="exit">
                       <Mic style={{ width: '20px', height: '20px' }} />
                    </MotionDiv>
                </button>
            </TooltipTrigger>
            <TooltipContent><p>Empezar a Grabar</p></TooltipContent>
          </Tooltip>
        );
      case 'recording':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
                 <button
                    type="button"
                    key="pause"
                    className="dream-rec-btn dream-rec-btn--recording"
                    onClick={onPause}
                    disabled={disabled}
                >
                    <MotionDiv variants={iconVariants} initial="hidden" animate="visible" exit="exit">
                       <Pause style={{ width: '20px', height: '20px' }} />
                    </MotionDiv>
                </button>
            </TooltipTrigger>
             <TooltipContent><p>Pausar Grabación</p></TooltipContent>
          </Tooltip>
        );
      case 'paused':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
                 <button
                    type="button"
                    key="resume"
                    className="dream-rec-btn"
                    onClick={onResume}
                    disabled={disabled}
                >
                    <MotionDiv variants={iconVariants} initial="hidden" animate="visible" exit="exit">
                       <Play style={{ width: '20px', height: '20px' }} />
                    </MotionDiv>
                </button>
            </TooltipTrigger>
            <TooltipContent><p>Reanudar Grabación</p></TooltipContent>
          </Tooltip>
        );
       case 'transcribing':
        return (
            <button
                disabled
                type="button"
                key="processing"
                className="dream-rec-btn"
            >
                <MotionDiv variants={iconVariants} initial="hidden" animate="visible" exit="exit">
                   <Loader2 style={{ width: '20px', height: '20px', animation: 'dream-spin 1s linear infinite' }} />
                </MotionDiv>
            </button>
        );
      case 'done':
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        key="clear"
                        className="dream-rec-btn dream-rec-btn--danger"
                        onClick={onClear}
                        disabled={disabled}
                    >
                        <MotionDiv variants={iconVariants} initial="hidden" animate="visible" exit="exit">
                           <Trash2 style={{ width: '20px', height: '20px' }} />
                        </MotionDiv>
                    </button>
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
                <button
                    type="button"
                    key="stop"
                    className="dream-rec-btn dream-rec-btn--danger"
                    onClick={onStop}
                >
                    <Square style={{ width: '20px', height: '20px' }} />
                </button>
            </TooltipTrigger>
            <TooltipContent><p>Finalizar Grabación</p></TooltipContent>
         </Tooltip>
       )
    }
    return null;
  }

  return (
    <TooltipProvider>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '56px', gap: '8px' }}>
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
