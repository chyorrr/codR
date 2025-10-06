"use client";
import dynamic from 'next/dynamic';

// Dynamically import components that use browser APIs to avoid SSR issues
const TargetCursor = dynamic(() => import('./TargetCursor'), { 
  ssr: false,
  loading: () => null 
});

const CodeBackground = dynamic(() => import('./CodeBackground'), { 
  ssr: false,
  loading: () => null 
});

export { TargetCursor, CodeBackground };