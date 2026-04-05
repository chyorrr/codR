'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html>
      <body className="bg-black">
        <div className="min-h-screen flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-gray-900 border-2 border-red-500/50 rounded-2xl p-8 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
            </motion.div>
            <h2 className="text-red-400 font-mono text-2xl font-bold mt-4">SYSTEM_ERROR</h2>
            <p className="text-gray-400 font-mono text-sm mt-2">
              {error?.message || 'An unexpected error occurred in the arena.'}
            </p>
            <div className="flex gap-3 mt-6 justify-center">
              <button
                onClick={reset}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl font-mono text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> RETRY
              </button>
              <a
                href="/"
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 px-6 rounded-xl font-mono text-sm transition-colors"
              >
                <Home className="w-4 h-4" /> HOME
              </a>
            </div>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
