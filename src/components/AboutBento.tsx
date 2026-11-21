import { type ReactNode, type MouseEvent, useRef, useEffect, useCallback, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { BlurFade } from './BlurFade'
import { DuolingoVectorFlame, StreakFireOverlay, type FlameOrigin } from './StreakFireOverlay'
import './AboutBento.css'

function scrollToAbout() {
  const el = document.getElementById('about')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

interface BentoCardProps {
  children: ReactNode
  className?: string
  standalone?: boolean
  cardRef?: React.RefObject<HTMLElement | null>
  onClick?: (e: MouseEvent<HTMLElement>) => void
  onMouseEnter?: (e: MouseEvent<HTMLElement>) => void
  onMouseLeave?: (e: MouseEvent<HTMLElement>) => void
}

function BentoCardWrapper({
  children,
  className = '',
  standalone = false,
  cardRef,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: BentoCardProps) {
  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`)
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`)
  }

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (onClick) {
      onClick(e)
    } else if (standalone) {
      scrollToAbout()
    }
  }

  return (
    <article
      ref={cardRef as any}
      className={`bento-card ${className} ${standalone ? 'is-standalone is-clickable' : ''}`}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      role={standalone || onClick ? 'button' : undefined}
      tabIndex={standalone || onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if ((standalone || onClick) && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleClick(e as any)
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bento-card-spotlight" aria-hidden="true" />
      <div className="bento-card-content">{children}</div>
    </article>
  )
}

export function ProfileCard({ standalone = false }: { standalone?: boolean }) {
  return (
    <BentoCardWrapper className="bento-card-profile" standalone={standalone}>
      <div className="bento-profile-wrap">
        <div className="about-portrait">
          <div className="bento-photo-container">
            <img
              src={`${import.meta.env.BASE_URL}peter-photo.jpg`}
              alt="Peter Shao"
              className="bento-profile-img"
              loading="lazy"
            />
          </div>
          <span className="about-photo-caption">Usually building something.</span>
          <svg className="about-portrait-spark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path
              d="M20 3 24 15 37 20 24 24 20 37 15 24 3 20 15 15Z"
              fill="#f9c950"
              stroke="#7d5423"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="bento-profile-info">
          <span className="about-eyebrow">A little about me</span>
          <h3 className="bento-card-title">Peter Shao</h3>
          <p className="bento-card-subtitle">Toronto, Canada · CE @ uWaterloo</p>
          <p className="bento-card-body">
            I love building software &amp; hardware that people find value in.
          </p>
          <div className="about-offline">
            <span className="about-eyebrow">Away from the keyboard</span>
            <ul className="about-hobbies" aria-label="In my free time">
              <li>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="4" y="3" width="16" height="18" rx="3" />
                  <path d="M4 9h16M4 15h16M8 6h.01M8 12h.01M8 18h.01M12 6h4M12 12h4M12 18h4" />
                </svg>
                Homelab nerd
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m8 6 2-3h4l2 3h3a2 2 0 0 1 2 2v11H3V8a2 2 0 0 1 2-2Z" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
                Audio &amp; camera aficionado
              </li>
            </ul>
          </div>
        </div>
      </div>
    </BentoCardWrapper>
  )
}

export function LanguagesCard({ standalone = false }: { standalone?: boolean }) {
  const flameSlotRef = useRef<HTMLSpanElement>(null)
  const settleTimerRef = useRef<number | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const [overlayOrigin, setOverlayOrigin] = useState<FlameOrigin | null>(null)
  const [justSettled, setJustSettled] = useState(false)

  const measureFlameOrigin = useCallback((): FlameOrigin | null => {
    const el = flameSlotRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width || 44,
      height: rect.height || 50,
    }
  }, [])

  const triggerSettleBounce = useCallback(() => {
    setJustSettled(true)
    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current)
    }
    settleTimerRef.current = window.setTimeout(() => {
      setJustSettled(false)
      settleTimerRef.current = null
    }, 520)
  }, [])

  const handleIgnite = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      if (overlayOrigin) return
      if (prefersReducedMotion) {
        triggerSettleBounce()
        return
      }
      const origin = measureFlameOrigin()
      if (origin) {
        setOverlayOrigin(origin)
      }
    },
    [measureFlameOrigin, overlayOrigin, prefersReducedMotion, triggerSettleBounce]
  )

  const handleOverlayComplete = useCallback(() => {
    setOverlayOrigin(null)
    triggerSettleBounce()
  }, [triggerSettleBounce])

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current)
      }
    }
  }, [])

  return (
    <BentoCardWrapper className="bento-card-languages" standalone={standalone}>
      <div className="bento-languages-content qe-languages-content">
        <h3 className="bento-card-title">I speak:</h3>
        <p className="qe-lang-native">Chinese and English</p>
        <p className="qe-lang-learning">Learning Spanish on Duolingo</p>
        <button
          type="button"
          className={`qe-streak-trigger ${overlayOrigin ? 'is-launched' : ''} ${justSettled ? 'is-settled' : ''}`.trim()}
          onClick={handleIgnite}
          aria-label="1,000+ day Duolingo streak — click to play full-screen fire animation"
        >
          <span ref={flameSlotRef} className="qe-flame-slot" aria-hidden="true">
            <DuolingoVectorFlame size={44} mode="idle" />
          </span>
          <span className="qe-streak-copy">
            <span className="qe-streak-number">1,000+</span>
            <span className="qe-streak-caption">day streak</span>
          </span>
        </button>
      </div>
      {overlayOrigin && (
        <StreakFireOverlay
          origin={overlayOrigin}
          getTargetOrigin={measureFlameOrigin}
          onComplete={handleOverlayComplete}
        />
      )}
    </BentoCardWrapper>
  )
}

export function WaterlooCard({ standalone = false }: { standalone?: boolean }) {
  return (
    <BentoCardWrapper className="bento-card-waterloo" standalone={standalone}>
      <div className="bento-waterloo-wrap">
        <div className="bento-crest-box">
          <img
            src={`${import.meta.env.BASE_URL}waterloo-crest.png`}
            alt="University of Waterloo Crest"
            className="waterloo-crest-img"
            loading="lazy"
          />
        </div>
        <div className="bento-waterloo-info">
          <h3 className="bento-card-title">University of Waterloo</h3>
          <p className="bento-card-subtitle">
            Waterloo, Ontario | First Year Computer Engineering
          </p>
          <p className="bento-card-body">
            Awesome school with the largest co-op program in NA. I am learning &amp; applying my skills
            in the workforce here.
          </p>
          <button
            type="button"
            className="bento-watcloud-pill"
            onClick={(e) => {
              e.stopPropagation()
              document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            <span className="exp-live-dot" aria-hidden="true" />
            <span className="bento-watcloud-name">WATonomous</span>
            <span className="bento-watcloud-sep" aria-hidden="true">·</span>
            <span className="bento-watcloud-role">Infrastructure Engineer</span>
            <span className="bento-watcloud-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </BentoCardWrapper>
  )
}

export function CompEngFocusCard({ standalone = false }: { standalone?: boolean }) {
  const focusAreas = [
    {
      title: 'Distributed systems',
      details: 'edge networking & IPS, stack design, data security',
    },
    {
      title: 'Machine learning',
      details: 'LLM Fine tuning, research reproduction & optimization, Applied ML',
    },
    {
      title: 'Electronics',
      details: 'embedded computing, imaging pipeline engineering, HW repairs',
    },
  ]

  return (
    <BentoCardWrapper className="bento-card-compeng" standalone={standalone}>
      <h3 className="bento-card-title bento-compeng-heading">
        I learn CompEng with a focus on:
      </h3>
      <div className="bento-focus-list">
        {focusAreas.map((area) => (
          <div key={area.title} className="bento-focus-row">
            <span className="bento-focus-bullet">-</span>
            <div className="bento-focus-text">
              <span className="bento-focus-name">{area.title}</span>{' '}
              <span className="bento-focus-desc">({area.details})</span>
            </div>
          </div>
        ))}
      </div>
    </BentoCardWrapper>
  )
}

export function AboutBentoGrid() {
  return (
    <div className="about-bento-grid" aria-label="About Me Grid">
      {/* Row 1: Profile + Languages */}
      <BlurFade delay={0.16} duration={0.65} yOffset={16}>
        <div className="about-bento-row-top">
          <ProfileCard />
          <LanguagesCard />
        </div>
      </BlurFade>

      {/* Row 2: University of Waterloo */}
      <BlurFade delay={0.34} duration={0.65} yOffset={16}>
        <div className="about-bento-row-middle">
          <WaterlooCard />
        </div>
      </BlurFade>

      {/* Row 3: CompEng Focus Areas */}
      <BlurFade delay={0.52} duration={0.65} yOffset={16}>
        <div className="about-bento-row-bottom">
          <CompEngFocusCard />
        </div>
      </BlurFade>
    </div>
  )
}
