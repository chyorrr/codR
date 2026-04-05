'use client';

import { motion } from 'framer-motion';
import { Home, ArrowLeft, Swords } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(239, 68, 68, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(239, 68, 68, 0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-lg w-full text-center"
      >
        {/* Glitchy 404 */}
        <motion.div
          className="relative mb-6"
          animate={{
            textShadow: [
              '0 0 0 rgba(0,0,0,0)',
              '3px 0 0 rgba(239, 68, 68, 0.5), -3px 0 0 rgba(59, 130, 246, 0.5)',
              '0 0 0 rgba(0,0,0,0)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <h1 className="text-9xl font-bold font-mono text-red-500 leading-none">404</h1>
        </motion.div>

        <h2 className="text-2xl text-gray-300 font-mono font-bold mb-3">TARGET_NOT_FOUND</h2>
        <p className="text-gray-500 font-mono text-sm mb-8">
          The route you&apos;re looking for has been eliminated from the arena.
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/">
            <motion.div
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl font-mono text-sm transition-colors cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home className="w-4 h-4" /> RETURN HOME
            </motion.div>
          </Link>
          <Link href="/arsenal">
            <motion.div
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 px-6 rounded-xl font-mono text-sm transition-colors cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Swords className="w-4 h-4" /> ARSENAL
            </motion.div>
          </Link>
        </div>

        {/* Terminal-style error */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 bg-gray-900/50 border border-red-500/20 rounded-lg p-4 text-left"
        >
          <div className="text-red-400 font-mono text-xs space-y-1">
            <div>$ route --resolve current_path</div>
            <div className="text-gray-500">Error: ENOENT - No such route or directory</div>
            <div className="text-gray-500">Stack: RouterContext.resolve → NotFoundBoundary</div>
            <motion.div
              className="text-red-400"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              $ _
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
