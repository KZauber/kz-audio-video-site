"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** "up" (default), "left", "right", or "none" */
  direction?: "up" | "left" | "right" | "none";
}

const variants = {
  up:    { hidden: { opacity: 0, y: 32 },  visible: { opacity: 1, y: 0 } },
  left:  { hidden: { opacity: 0, x: -32 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 32 },  visible: { opacity: 1, x: 0 } },
  none:  { hidden: { opacity: 0 },          visible: { opacity: 1 } },
};

export default function FadeIn({
  children,
  delay = 0,
  className,
  direction = "up",
}: Props) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
      variants={variants[direction]}
    >
      {children}
    </motion.div>
  );
}
