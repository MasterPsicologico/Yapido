'use client';

import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    if (!stream || !stream.active || stream.getAudioTracks().length === 0) {
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      return;
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let phase = 0;

    const draw = () => {
      animationFrameId.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const w = canvas.width = canvas.clientWidth;
      const h = canvas.height = canvas.clientHeight;

      canvasCtx.fillStyle = 'rgba(230, 30%, 6%, 0.18)';
      canvasCtx.fillRect(0, 0, w, h);

      const gradient = canvasCtx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, 'rgba(147, 197, 253, 0.15)');
      gradient.addColorStop(0.5, 'rgba(165, 180, 252, 0.5)');
      gradient.addColorStop(1, 'rgba(196, 181, 253, 0.15)');

      const bars = 64;
      const step = Math.floor(bufferLength / bars);
      const barWidth = w / bars - 2;
      let x = 0;

      for (let i = 0; i < bars; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) sum += dataArray[i * step + j];
        const avg = sum / step;
        const barHeight = (avg / 255) * h * 0.8;
        const yOffset = (h - barHeight) / 2;

        canvasCtx.fillStyle = gradient;
        canvasCtx.shadowBlur = 12;
        canvasCtx.shadowColor = i < bars / 2 ? 'rgba(147, 197, 253, 0.6)' : 'rgba(196, 181, 253, 0.6)';

        const y = (h - barHeight) / 2;
        ctx_roundRect(canvasCtx, x, y, barWidth, Math.max(barHeight, 2), 2);

        canvasCtx.shadowBlur = 0;
        canvasCtx.shadowColor = 'transparent';
        canvasCtx.fill();
        x += barWidth + 2;
      }

      canvasCtx.beginPath();
      canvasCtx.lineWidth = 1.5;
      canvasCtx.strokeStyle = 'rgba(147, 197, 253, 0.3)';
      phase += 0.04;
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin(x * 0.02 + phase) * 8;
        if (x === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);
      }
      for (let x = w; x >= 0; x--) {
        const y = h / 2 + Math.sin(x * 0.02 + phase + 1) * 6;
        canvasCtx.lineTo(x, y);
      }
      canvasCtx.closePath();
      canvasCtx.stroke();
    };

    function ctx_roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      if (h <= 0 || w <= 0) return;
      if (r > w / 2) r = w / 2;
      if (r > h / 2) r = h / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    draw();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [stream]);

  return <canvas ref={canvasRef} className="dream-visualizer-canvas" />;
};

export default AudioVisualizer;
