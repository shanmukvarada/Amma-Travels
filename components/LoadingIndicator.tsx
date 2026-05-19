'use client';

import { CarFront } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoadingIndicatorProps {
  isLoading: boolean;
}

export default function LoadingIndicator({ isLoading }: LoadingIndicatorProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto"
        >
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Circular Path */}
            <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
            
            {/* Rotating Car Container */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-red-600 p-2 rounded-lg shadow-lg rotate-90">
                  <CarFront size={20} className="text-white" />
                </div>
              </div>
            </motion.div>

            {/* Central Text */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-black uppercase tracking-[0.2em] text-white drop-shadow-md">Loading</span>
              <motion.div 
                className="flex gap-1"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full transition-delay-150"></div>
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full transition-delay-300"></div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
