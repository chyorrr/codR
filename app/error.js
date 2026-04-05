'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Error({ error, reset }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-gray-900 border border-red-500/40 rounded-2xl p-8 text-center"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AlertTriangle className="w-14 h-14 text-red-400 mx-auto" />
        </motion.div>
        <h2 className="text-red-400 font-mono text-xl font-bold mt-4">RUNTIME_ERROR</h2>
        <p className="text-gray-400 font-mono text-sm mt-2 break-words">
          {error?.message || 'Something went wrong.'}
        </p>
        <div className="flex gap-3 mt-6 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-xl font-mono text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> RETRY
          </button>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 px-5 rounded-xl font-mono text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> BACK
          </button>
        </div>
      </motion.div>
    </div>
  );
}
