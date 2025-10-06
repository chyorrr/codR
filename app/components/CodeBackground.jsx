"use client";
import React, { useEffect, useRef } from "react";

const CodeBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * 2 * dpr); // allow for extra vertical spread
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]();<>";

    const splatters = [];
    const splatterCount = 420; // more visible density

    for (let i = 0; i < splatterCount; i++) {
      const fontSize = 12 + Math.random() * 42; // larger sizes
      splatters.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        char: chars[Math.floor(Math.random() * chars.length)],
        fontSize,
        speed: 0.4 + Math.random() * 2.6,
        opacity: 0.05 + Math.random() * 0.6,
        rotation: Math.random() * 90 - 45,
        hue: 340 + Math.random() * 60 // red/pinkish tints (340-400)
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // layered background pass for subtle glow
      splatters.forEach((s) => {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate((s.rotation * Math.PI) / 180);
        ctx.font = `${s.fontSize}px monospace`;

        // soft glow: draw blurred-looking shadow by multiple low-alpha strokes
        const baseAlpha = Math.max(0.06, Math.min(0.9, s.opacity));
        const hue = s.hue % 360;
        const glowColor = `hsla(${hue}, 80%, 55%, ${baseAlpha * 0.35})`;
        ctx.fillStyle = glowColor;
        // slightly offset shadow layers
        for (let g = 0; g < 2; g++) {
          ctx.globalAlpha = baseAlpha * 0.15;
          ctx.fillText(s.char, g * 0.6 - 0.6, g * 0.6 - 0.6);
        }

        // main char
        ctx.globalAlpha = Math.min(1, baseAlpha + 0.15);
        ctx.fillStyle = `hsla(${hue}, 90%, 60%, ${Math.min(1, baseAlpha)})`;
        ctx.fillText(s.char, 0, 0);

        // thin stroke to help contrast on dark backgrounds
        ctx.lineWidth = Math.max(0.5, s.fontSize * 0.06);
        ctx.strokeStyle = `hsla(${hue}, 30%, 8%, ${Math.min(0.9, baseAlpha * 0.6)})`;
        ctx.strokeText(s.char, 0, 0);

        ctx.restore();

        s.y += s.speed;
        if (s.y > canvas.height) s.y = -20 - Math.random() * 200;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default CodeBackground;
