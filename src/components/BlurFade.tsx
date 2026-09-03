import { motion, useReducedMotion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

interface BlurFadeProps {
  children: ReactNode
  className?: string
  variant?: {
    hidden: { y: number; opacity: number; filter: string }
    visible: { y: number; opacity: number; filter: string }
  }
  duration?: number
  delay?: number
  yOffset?: number
  inView?: boolean
  inViewMargin?: string
  blur?: string
}

export function BlurFade({
  children,
  className,
  variant,
  duration = 0.5,
  delay = 0,
  yOffset = 8,
  inView = true,
  inViewMargin = '-40px',
  blur = '6px',
}: BlurFadeProps) {
  const shouldReduceMotion = useReducedMotion()

  const defaultVariants: Variants = {
    hidden: {
      y: shouldReduceMotion ? 0 : yOffset,
      opacity: 0,
      filter: shouldReduceMotion ? 'none' : `blur(${blur})`,
    },
    visible: {
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
    },
  }

  const combinedVariants = variant || defaultVariants

  return (
    <motion.div
      initial="hidden"
      animate={inView ? undefined : 'visible'}
      whileInView={inView ? 'visible' : undefined}
      viewport={{ once: true, margin: inViewMargin as any }}
      variants={combinedVariants}
      transition={{
        delay: shouldReduceMotion ? 0 : 0.04 + delay,
        duration: shouldReduceMotion ? 0 : duration,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
