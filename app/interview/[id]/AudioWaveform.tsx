"use client";

import { useEffect, useRef } from 'react';

type Props = {
  stream: MediaStream | null;
  active: boolean;
  barCount?: number;
  height?: number;
  color?: string;
};

/**
 * Live audio waveform visualization for the interview voice-mode recording.
 *
 * Connects an AnalyserNode to the active MediaStream and renders a row of
 * vertical bars whose heights track real-time frequency-domain energy.
 * Bars are smoothed with linear interpolation between frames and decay
 * gently when audio drops, so the motion stays expressive but never jittery.
 *
 * When 'active' flips to false the bars fade out to a flat baseline and the
 * AudioContext is released. Mounting/unmounting is safe to do repeatedly
 * across recording sessions.
 */
export default function AudioWaveform({
  stream,
  active,
  barCount = 28,
  height = 36,
  color = '#B88736',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const smoothedRef = useRef<number[]>(new Array(barCount).fill(0));
  const phaseRef = useRef<number>(0);

  // Resize canvas to its DOM size, accounting for device pixel ratio.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = typeof window !== 'undefined' ? Math.max(1, window.devicePixelRatio || 1) : 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    const obs = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (obs) obs.observe(canvas);
    return () => { if (obs) obs.disconnect(); };
  }, []);

  // Wire up AudioContext when stream becomes available + active.
  useEffect(() => {
    if (!active || !stream) {
      // Tear down if we had a context.
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch {}
        sourceRef.current = null;
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
        audioCtxRef.current = null;
      }
      analyserRef.current = null;
      dataRef.current = null;
      return;
    }
    try {
      const AC: typeof AudioContext = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      if (!AC) return;
      const ctx = new AC();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      // Some browsers start the context in 'suspended' state.
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {
      // If anything fails we just render an idle pulse below.
    }
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch {}
        sourceRef.current = null;
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
        audioCtxRef.current = null;
      }
      analyserRef.current = null;
      dataRef.current = null;
    };
  }, [active, stream]);

  // Render loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx2d.clearRect(0, 0, w, h);

      const smoothed = smoothedRef.current;
      // Compute targets per bar.
      const targets: number[] = new Array(barCount).fill(0);
      const analyser = analyserRef.current;
      const data = dataRef.current;
      if (active && analyser && data) {
        analyser.getByteFrequencyData(data);
        // Map frequency bins into 'barCount' buckets, focusing on the
        // speech-relevant low/mid range (skip the very lowest bin which
        // tends to pick up DC/rumble).
        const usable = Math.min(data.length, 96); // ~ up to ~7.5 kHz at 24kHz sample rate
        const start = 2;
        const span = Math.max(1, usable - start);
        for (let i = 0; i < barCount; i++) {
          const a = start + Math.floor((i / barCount) * span);
          const b = start + Math.floor(((i + 1) / barCount) * span);
          let sum = 0;
          let count = 0;
          for (let k = a; k < b; k++) { sum += data[k]; count++; }
          const avg = count > 0 ? sum / count : 0;
          // Normalize 0..255 -> 0..1 with a gentle non-linear curve so quiet
          // voice still shows visible motion.
          const norm = Math.pow(avg / 255, 0.7);
          targets[i] = norm;
        }
      } else if (active) {
        // No analyser yet but recording started: gentle idle pulse so the
        // user sees the row is alive while permission/context spin up.
        phaseRef.current += 0.06;
        for (let i = 0; i < barCount; i++) {
          const phase = phaseRef.current + i * 0.35;
          targets[i] = 0.10 + 0.06 * (0.5 + 0.5 * Math.sin(phase));
        }
      } else {
        // Inactive: fade to baseline.
        for (let i = 0; i < barCount; i++) targets[i] = 0;
      }

      // Smooth toward target (asymmetric: rise faster than fall for snappy feel).
      for (let i = 0; i < barCount; i++) {
        const target = targets[i];
        const cur = smoothed[i];
        const k = target > cur ? 0.45 : 0.18;
        smoothed[i] = cur + (target - cur) * k;
      }

      // Draw bars.
      const barTotalSpace = w / barCount;
      const barWidth = Math.max(2, Math.floor(barTotalSpace * 0.55));
      const centerY = h / 2;
      const minBar = Math.max(2, Math.floor(h * 0.08));
      const maxBar = h * 0.92;
      ctx2d.fillStyle = color;
      for (let i = 0; i < barCount; i++) {
        // Edge attenuation: center bars taller than far edges for a soft envelope.
        const distFromCenter = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2);
        const envelope = 0.55 + 0.45 * (1 - distFromCenter * distFromCenter);
        const v = smoothed[i] * envelope;
        const barH = Math.max(minBar, Math.min(maxBar, v * maxBar + minBar));
        const x = Math.floor(i * barTotalSpace + (barTotalSpace - barWidth) / 2);
        const y = Math.floor(centerY - barH / 2);
        // Rounded caps via two filled rects + circles approximation: just rect for crispness.
        ctx2d.globalAlpha = active ? (0.55 + 0.45 * (1 - distFromCenter)) : 0.25;
        ctx2d.fillRect(x, y, barWidth, Math.floor(barH));
      }
      ctx2d.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [active, barCount, color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ width: '100%', height: height + 'px', display: 'block' }}
    />
  );
}
