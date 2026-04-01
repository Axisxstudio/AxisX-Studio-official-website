"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const PRELOADER_DURATION_MS = 1200;

export default function Preloader() {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!show) return;

    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const ratio = Math.min(elapsed / PRELOADER_DURATION_MS, 1);
      setProgress(Math.round(ratio * 100));

      if (ratio < 1) {
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      window.setTimeout(() => setShow(false), 180);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0e0e10]"
        >
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a3a6ff]/5 blur-[120px] pointer-events-none animate-pulse" />
          </div>

          <div className="relative z-10 text-center">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mb-10 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#a3a6ff] to-[#c180ff] shadow-[0_0_50px_rgba(163,166,255,0.2)]"
            >
              <span className="font-outfit text-5xl font-black text-[#0e0e10]">X</span>
            </motion.div>

            <div className="mx-auto mb-6 h-[2px] w-64 overflow-hidden rounded-full bg-[#a3a6ff]/10">
              <motion.div
                className="h-full bg-gradient-to-r from-[#a3a6ff] to-[#c180ff]"
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear", duration: 0.1 }}
              />
            </div>

            <div className="flex items-center justify-center gap-10">
              <p className="text-4xl font-outfit font-black text-[#f9f5f8]">
                {progress}%
              </p>
              <div className="h-10 w-px bg-[#a3a6ff]/20" />
              <div className="text-left">
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#a3a6ff]">
                  AXISX STUDIO
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#adaaad]">
                  Loading Excellence...
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
