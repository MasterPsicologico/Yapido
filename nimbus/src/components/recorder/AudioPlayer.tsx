'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface AudioPlayerProps {
  audioUrl: string;
  setAudioStream: (stream: MediaStream | null) => void;
  onPlaybackStateChange: (isPlaying: boolean) => void;
}

export default function AudioPlayer({ audioUrl, setAudioStream, onPlaybackStateChange }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const captureStream = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      try {
        // Detener cualquier stream anterior
        setAudioStream(null);
        
        let stream: MediaStream | null = null;
        if ('captureStream' in audio) {
          stream = (audio as any).captureStream();
        } else if ('mozCaptureStream' in audio) {
          stream = (audio as any).mozCaptureStream();
        }
        
        if (stream && stream.getAudioTracks().length > 0) {
            setAudioStream(stream);
        }
      } catch (e) {
        console.error("Error capturing stream:", e);
        setAudioStream(null);
      }
    }
  }, [setAudioStream]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  useEffect(() => {
    onPlaybackStateChange(isPlaying);
    if(isPlaying) {
        captureStream();
    } else {
        setAudioStream(null);
    }
  }, [isPlaying, onPlaybackStateChange, captureStream, setAudioStream]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (audio.paused) {
      audio.play().catch(e => console.error("Error playing audio:", e));
    } else {
      audio.pause();
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  
  const handleRestart = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      setCurrentTime(0);
      if(audio.paused) {
          audio.play().catch(e => console.error("Error playing audio:", e));
      }
  }

  return (
    <div className="w-full space-y-3 rounded-lg bg-card/50 p-4 border">
        <audio ref={audioRef} src={audioUrl} preload="metadata" crossOrigin="anonymous" />
        <div className="flex items-center gap-4">
             <Button onClick={togglePlayPause} size="icon" className="h-12 w-12 rounded-full">
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
             </Button>
            <div className="flex-1">
                <Slider
                    value={[currentTime]}
                    max={duration || 1}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="w-full"
                />
                 <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
             <Button onClick={handleRestart} size="icon" variant="ghost" className="h-10 w-10 rounded-full">
                <RotateCcw className="h-5 w-5" />
             </Button>
        </div>
    </div>
  );
}
