import { motion, useInView, type Variants } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
}

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function ScrollReveal({
  children,
  className,
  variants = defaultVariants,
  delay = 0,
  duration = 0.6,
  once = true,
  amount = 0.15,
}: ScrollRevealProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={variants}
      transition={{ delay, duration, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ children, className, staggerDelay = 0.08 }: StaggerContainerProps) {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: staggerDelay, delayChildren: 0.1 },
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function StaggerItem({ children, className, variants = itemVariants }: StaggerItemProps) {
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}