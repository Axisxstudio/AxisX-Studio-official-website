"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  suffix?: string;
  className?: string;
}

export const CountUp = ({
  to,
  from = 0,
  duration = 2,
  delay = 0,
  suffix = "",
  className = "",
}: CountUpProps) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: "-100px" });
  
  const count = useMotionValue(from);
  const rounded = useSpring(count, {
    stiffness: 50,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    if (inView) {
      const timeout = setTimeout(() => {
        count.set(to);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [inView, to, count, delay]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => {
      if (nodeRef.current) {
        nodeRef.current.textContent = Math.floor(latest).toString() + suffix;
      }
    });
    return unsubscribe;
  }, [rounded, suffix]);

  return (
    <span
      ref={nodeRef}
      className={className}
    >
      {from}{suffix}
    </span>
  );
};
