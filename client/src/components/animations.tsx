import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

export function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-72px" });
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function MotionButton({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.button
      className={className}
      whileHover={shouldReduce ? {} : { scale: 1.03 }}
      whileTap={shouldReduce ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </motion.button>
  );
}

export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
  },
};
