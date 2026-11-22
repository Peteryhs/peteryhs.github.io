import { CategoryIcon, type IconKind } from './CategoryIcon'
import { type ReactNode, type MouseEvent, useRef, useEffect, useCallback, useState } from 'react'
import { BlurFade } from './BlurFade'
import { DuolingoVectorFlame, StreakFireOverlay, type FlameOrigin, type StreakVariant } from './StreakFireOverlay'
import { openProject, projectHref } from '../hooks/useRoute'
import { discover } from '../hooks/secrets'
import { PixelPortrait } from './PixelPortrait'
import { SwapText } from './SwapText'
import './AboutBento.css'

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function ArrowRightIcon() {
  return (
    <svg
      className="about-arrow-inline"
      viewBox="0 0 16 16"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 8h9M8.5 4l4 4-4 4" />
    </svg>
  )
}

interface AboutCardProps {
  children: ReactNode
  overlay?: ReactNode
  className?: string
  standalone?: boolean
  cardRef?: React.RefObject<HTMLElement | null>
  ariaLabel?: string
  onClick?: (e: MouseEvent<HTMLElement>) => void
}

function AboutCardShell({
  children,
  overlay,
  className = '',
  standalone = false,
  cardRef,
  ariaLabel,
  onClick,
}: AboutCardProps) {
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
      scrollToSection('about')
    }
  }

  const interactive = Boolean(standalone || onClick)

  return (
    <article
      ref={cardRef as any}
      className={`about-card ${className} ${standalone ? 'is-standalone is-clickable' : ''}`.trim()}
      aria-label={ariaLabel}
      onMouseMove={handleMouseMove}
      onClick={interactive ? handleClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleClick(e as any)
              }
            }
          : undefined
      }
    >
      <div className="about-card-spotlight" aria-hidden="true" />
      <div className="about-card-body">{children}</div>
      {overlay}
    </article>
  )
}

export function ProfileCard({ standalone = false }: { standalone?: boolean }) {
  return (
    <AboutCardShell className="about-card-profile" standalone={standalone}>
      <div className="about-profile-grid">
        <PixelPortrait src={`${import.meta.env.BASE_URL}peter-photo.jpg`} alt="Peter Shao" />
        <div className="about-bio">
          <p className="about-lead">
            I&rsquo;m Peter, splitting my time between Oakville and Waterloo. I like building
            software and hardware that people actually get use out of, and most of my free time
            goes into my homelab, cameras, and audio gear.
          </p>
        </div>
      </div>
    </AboutCardShell>
  )
}

export function WaterlooCard({ standalone = false }: { standalone?: boolean }) {
  return (
    <AboutCardShell className="about-card-school" standalone={standalone}>
      <div className="about-school-inner">
        <img
          src={`${import.meta.env.BASE_URL}waterloo-shield.svg`}
          alt="University of Waterloo shield"
          className="about-shield"
          loading="lazy"
        />
        <div className="about-school-copy">
          <h3 className="about-card-heading">University of Waterloo</h3>
          <p className="about-school-program">Computer Engineering &rsquo;31</p>
          <p className="about-school-sub">
            <span className="about-mono">
              <SwapText rest="ECE Co-op · Stream 8" alt="8 months of school, then co-op" />
            </span>
          </p>
        </div>
      </div>
    </AboutCardShell>
  )
}

let hasAutoPlayedLanguagesStreak = false

export function LanguagesCard({
  standalone = false,
  autoPlayOnMount = false,
}: {
  standalone?: boolean
  autoPlayOnMount?: boolean
}) {
  const cardRef = useRef<HTMLElement>(null)
  const flameSlotRef = useRef<HTMLSpanElement>(null)
  const settleTimerRef = useRef<number | null>(null)
  const autoTimerRef = useRef<number | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const [overlayState, setOverlayState] = useState<{ origin: FlameOrigin; variant: StreakVariant; seq: number } | null>(null)
  const [justSettled, setJustSettled] = useState(false)
  const seqRef = useRef<number>(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setPrefersReducedMotion(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) {
      setOverlayState(null)
    }
  }, [prefersReducedMotion])

  const measureFlameOrigin = useCallback((): FlameOrigin | null => {
    const cardEl = cardRef.current
    const slotEl = flameSlotRef.current
    if (!cardEl || !slotEl) return null
    const cardRect = cardEl.getBoundingClientRect()
    const slotRect = slotEl.getBoundingClientRect()
    if (cardRect.width <= 0 || cardRect.height <= 0) return null
    return {
      x: slotRect.left - cardRect.left + slotRect.width / 2,
      y: slotRect.top - cardRect.top + slotRect.height / 2,
      width: slotRect.width || 42,
      height: slotRect.height || 48,
      cardWidth: cardRect.width,
      cardHeight: cardRect.height,
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

  const launchAnimation = useCallback(
    (variant: StreakVariant) => {
      if (prefersReducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      if (autoTimerRef.current !== null) {
        window.clearTimeout(autoTimerRef.current)
        autoTimerRef.current = null
      }
      const origin = measureFlameOrigin()
      if (origin) {
        seqRef.current += 1
        setOverlayState({ origin, variant, seq: seqRef.current })
      }
    },
    [measureFlameOrigin, prefersReducedMotion]
  )

  useEffect(() => {
    const playImmediately = standalone || autoPlayOnMount
    if (prefersReducedMotion) return
    if (!playImmediately && hasAutoPlayedLanguagesStreak) return
    const cardEl = cardRef.current
    if (!cardEl) return

    let fired = false
    const delayMs = playImmediately ? 460 : 280
    const triggerOnce = () => {
      if (fired) return
      if (!playImmediately && hasAutoPlayedLanguagesStreak) return
      fired = true
      if (!playImmediately) hasAutoPlayedLanguagesStreak = true
      autoTimerRef.current = window.setTimeout(() => {
        autoTimerRef.current = null
        launchAnimation('inplace')
      }, delayMs)
    }

    if (playImmediately || typeof IntersectionObserver === 'undefined') {
      triggerOnce()
      return () => {
        if (autoTimerRef.current !== null) {
          window.clearTimeout(autoTimerRef.current)
          autoTimerRef.current = null
        }
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          triggerOnce()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(cardEl)

    return () => {
      observer.disconnect()
      if (autoTimerRef.current !== null) {
        window.clearTimeout(autoTimerRef.current)
        autoTimerRef.current = null
      }
    }
  }, [autoPlayOnMount, launchAnimation, prefersReducedMotion, standalone])

  const handleIgnite = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      if (overlayState?.variant === 'full') return
      launchAnimation('full')
      discover('streak')
    },
    [launchAnimation, overlayState]
  )

  const handleOverlayComplete = useCallback(() => {
    setOverlayState(null)
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
    <AboutCardShell
      className="about-card-languages"
      standalone={standalone}
      cardRef={cardRef}
      overlay={
        overlayState ? (
          <StreakFireOverlay
            key={overlayState.seq}
            origin={overlayState.origin}
            variant={overlayState.variant}
            onComplete={handleOverlayComplete}
          />
        ) : null
      }
    >
      <div className="about-lang-inner">
        <div className="about-lang-copy">
          <h3 className="about-card-heading">Languages</h3>
          <p className="about-lang-native">
            <span lang="zh-Hans">中文</span> &amp; English
          </p>
          <p className="about-lang-learning">
            <SwapText rest="Learning Spanish" alt={<span lang="es">Aprendiendo español</span>} />
          </p>
        </div>

        {prefersReducedMotion ? (
          <div className="about-streak-btn is-static" aria-label="1,000+ day Duolingo streak">
            <span ref={flameSlotRef} className="about-flame-slot" aria-hidden="true">
              <DuolingoVectorFlame size={42} mode="idle" />
            </span>
            <span className="about-streak-meta">
              <span className="about-streak-num">1,000+</span>
              <span className="about-streak-caption">day streak</span>
            </span>
          </div>
        ) : (
          <button
            type="button"
            className={`about-streak-btn ${overlayState ? 'is-launched' : ''} ${justSettled ? 'is-settled' : ''}`.trim()}
            onClick={handleIgnite}
            aria-label="1,000+ day Duolingo streak — click for full celebration"
          >
            <span ref={flameSlotRef} className="about-flame-slot" aria-hidden="true">
              <DuolingoVectorFlame size={42} mode="idle" />
            </span>
            <span className="about-streak-meta">
              <span className="about-streak-num">1,000+</span>
              <span className="about-streak-caption">day streak</span>
            </span>
          </button>
        )}
      </div>
    </AboutCardShell>
  )
}

interface FocusTrackItem {
  kind: IconKind
  title: string
  summary: string
  stack: string
  linkLabel: string
  projectSlug?: string
  scrollTarget?: string
}

const FOCUS_TRACKS: FocusTrackItem[] = [
  {
    kind: 'systems',
    title: 'Distributed systems',
    summary:
      'Edge networking, intrusion prevention, Linux clusters, and self-hosted infrastructure built to serve more than just my own desk.',
    stack: 'Slurm · Kubernetes · CrowdSec IPS',
    linkLabel: 'Sun Systems',
    projectSlug: 'sun-systems',
  },
  {
    kind: 'machine-learning',
    title: 'Machine learning',
    summary:
      'Fine-tuning open weights, reproducing research papers, and cutting inference latency down to something practical.',
    stack: 'PyTorch · LLM Fine-tuning · Evals',
    linkLabel: 'AI Detector',
    projectSlug: 'ai-detector',
  },
  {
    kind: 'electronics',
    title: 'Electronics',
    summary:
      'Embedded microcontrollers, camera imaging pipelines, and opening broken hardware until I understand how it works.',
    stack: 'Embedded · Imaging · PCBs',
    linkLabel: 'Camera gear',
    scrollTarget: 'hobbies-photography',
  },
]

export function CompEngFocusCard({ standalone = false }: { standalone?: boolean }) {
  return (
    <AboutCardShell
      className="about-card-focus"
      standalone={standalone}
      ariaLabel="Computer engineering focus areas"
    >
      <div className="about-tracks-grid">
        {FOCUS_TRACKS.map((track) => (
          <div key={track.title} className="about-track-col">
            <div className="about-track-head">
              <CategoryIcon kind={track.kind} className="about-track-icon" />
              <h3 className="about-track-title">{track.title}</h3>
            </div>

            <p className="about-track-summary">{track.summary}</p>

            <div className="about-track-foot">
              <p className="about-track-stack">{track.stack}</p>
              {track.projectSlug ? (
                <a
                  href={projectHref(track.projectSlug)}
                  className="about-track-link"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
                    e.preventDefault()
                    openProject(track.projectSlug!)
                  }}
                >
                  <span>{track.linkLabel}</span>
                  <ArrowRightIcon />
                </a>
              ) : (
                <button
                  type="button"
                  className="about-track-link about-track-link-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (track.scrollTarget) scrollToSection(track.scrollTarget)
                  }}
                >
                  <span>{track.linkLabel}</span>
                  <ArrowRightIcon />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AboutCardShell>
  )
}

export function AboutBentoGrid() {
  return (
    <div className="about-bento-grid" aria-label="About Me">
      <BlurFade delay={0.12} duration={0.55} yOffset={12}>
        <ProfileCard />
      </BlurFade>

      <BlurFade delay={0.22} duration={0.55} yOffset={12}>
        <div className="about-bento-row-mid">
          <WaterlooCard />
          <LanguagesCard />
        </div>
      </BlurFade>

      <BlurFade delay={0.32} duration={0.55} yOffset={12}>
        <CompEngFocusCard />
      </BlurFade>
    </div>
  )
}
