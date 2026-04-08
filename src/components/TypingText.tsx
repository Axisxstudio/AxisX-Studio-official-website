"use client";

import { motion, Variants } from "framer-motion";

interface TypingTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const TypingText = ({ text, className, delay = 0 }: TypingTextProps) => {
  const words = text.split(" ");

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: delay * i },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      x: -2,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.span
      style={{ overflow: "hidden", display: "inline-flex", flexWrap: "wrap", justifyContent: "center" }}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={className}
    >
      {words.map((word, wordIdx) => (
        <span key={wordIdx} className="inline-block whitespace-nowrap">
          {Array.from(word).map((letter, letterIdx) => (
            <motion.span variants={child} key={letterIdx} style={{ display: "inline-block" }}>
              {letter}
            </motion.span>
          ))}
          {wordIdx < words.length - 1 && (
            <motion.span variants={child} style={{ display: "inline-block" }}>
              &nbsp;
            </motion.span>
          )}
        </span>
      ))}
    </motion.span>
  );
};
