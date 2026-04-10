"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BrandLogo from "@/components/BrandLogo";

const PRELOADER_DURATION_MS = 1200;

export default function Preloader() {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!show) return;

    let isLoaded = false;
    const handleLoad = () => { isLoaded = true; };
    if (document.readyState === "complete") {
      isLoaded = true;
    } else {
      window.addEventListener("load", handleLoad);
    }

    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progressRatio = Math.min(elapsed / PRELOADER_DURATION_MS, 0.99);
      
      // If window is loaded, we can finish the progress, otherwise we slow down at 99%
      let currentProgress;
      if (isLoaded) {
        const exitRatio = Math.min((elapsed - 200) / 400, 1); // Extra time to finish quickly after load
        currentProgress = Math.round(Math.max(99 * progressRatio, 100 * exitRatio));
      } else {
        currentProgress = Math.round(progressRatio * 100);
      }

      setProgress(currentProgress);

      if (currentProgress < 100) {
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      window.setTimeout(() => setShow(false), 300);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("load", handleLoad);
    };
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
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mb-10 flex items-center justify-center"
            >
              <BrandLogo
                alt=""
                className="h-auto w-28 drop-shadow-[0_0_35px_rgba(68,180,255,0.3)] md:w-32"
                priority
                variant="mark"
              />
            </motion.div>

            <div className="mt-8 flex flex-col items-center">
              <div className="flex items-center gap-[2px]">
                {"AXISX STUDIO".split("").map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                    animate={{ 
                      opacity: progress > (i * 8) ? 1 : 0, 
                      y: progress > (i * 8) ? 0 : 10,
                      filter: progress > (i * 8) ? "blur(0px)" : "blur(10px)"
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`text-xl font-outfit font-black tracking-[0.3em] ${char === " " ? "ml-4" : ""} ${i < 5 ? "text-[#3B82F6]" : "text-[#F8FAFC]"}`}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
              
              {/* Animated underline */}
              <div className="mt-4 h-[1px] w-48 bg-[#3B82F6]/10 relative overflow-hidden">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent w-full"
                  animate={{ 
                    x: ["-100%", "100%"] 
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
