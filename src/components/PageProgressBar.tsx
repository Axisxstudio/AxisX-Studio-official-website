"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export default function PageProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  return (
    <motion.div
      key={routeKey}
      initial={{ scaleX: 0, opacity: 1, originX: 0 }}
      animate={{ scaleX: 1, opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut", times: [0, 0.85, 1] }}
      className="pointer-events-none fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#a3a6ff] via-[#c180ff] to-[#a3a6ff] z-[10000] shadow-[0_0_10px_rgba(163,166,255,0.5)]"
    />
  );
}
