import { type ReactNode, type MouseEvent, useEffect, useId, useRef, useState } from 'react'
import { BlurFade } from './BlurFade'
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

const STREAK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const BURST_SPARKS = [
  { cx: 60, cy: 20, tx: '-26px', ty: '-22px', rot: '-40deg', color: '#ffd43b', size: 6 },
  { cx: 88, cy: 36, tx: '24px', ty: '-18px', rot: '45deg', color: '#ff9600', size: 5.5 },
  { cx: 95, cy: 66, tx: '22px', ty: '8px', rot: '70deg', color: '#ff5c00', size: 5 },
  { cx: 30, cy: 36, tx: '-24px', ty: '-14px', rot: '-55deg', color: '#ff9600', size: 5.5 },
  { cx: 24, cy: 66, tx: '-22px', ty: '10px', rot: '-75deg', color: '#ffd43b', size: 5 },
  { cx: 60, cy: 14, tx: '6px', ty: '-26px', rot: '30deg', color: '#58cc02', size: 4.5 },
]

function StreakMascotArt({ burstKey }: { burstKey: number }) {
  const uid = useId().replace(/:/g, '')
  const haloId = `streakHalo-${uid}`
  const outerId = `streakOuter-${uid}`
  const innerId = `streakInner-${uid}`

  return (
    <div className="about-streak-art" aria-hidden="true">
      <svg
        className="streak-vector-svg"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={haloId} cx="50%" cy="54%" r="50%">
            <stop offset="0%" stopColor="#ffc83d" stopOpacity="0.48" />
            <stop offset="68%" stopColor="#ff8800" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#ff6a00" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={outerId} x1="60" y1="16" x2="60" y2="104" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffe15a" />
            <stop offset="42%" stopColor="#ff9900" />
            <stop offset="100%" stopColor="#e83f00" />
          </linearGradient>
          <linearGradient id={innerId} x1="60" y1="42" x2="60" y2="98" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff7cc" />
            <stop offset="55%" stopColor="#ffd23f" />
            <stop offset="100%" stopColor="#ff8c00" />
          </linearGradient>
        </defs>

        <circle cx="60" cy="64" r="48" fill={`url(#${haloId})`} />

        <g className="streak-aura-ring">
          <circle
            cx="60"
            cy="64"
            r="44"
            stroke="#ff9600"
            strokeOpacity="0.35"
            strokeWidth="2.5"
            strokeDasharray="6 9"
            strokeLinecap="round"
          />
        </g>

        <ellipse cx="60" cy="103" rx="25" ry="5.5" fill="#d95300" fillOpacity="0.2" />

        <g key={burstKey} className="streak-burst-group">
          <line className="streak-burst-ray" x1="60" y1="12" x2="60" y2="2" stroke="#ffb703" strokeWidth="3.2" strokeLinecap="round" />
          <line className="streak-burst-ray" x1="94" y1="26" x2="103" y2="18" stroke="#ff7a00" strokeWidth="3" strokeLinecap="round" />
          <line className="streak-burst-ray" x1="106" y1="62" x2="116" y2="62" stroke="#ffb703" strokeWidth="3" strokeLinecap="round" />
          <line className="streak-burst-ray" x1="26" y1="26" x2="17" y2="18" stroke="#ff7a00" strokeWidth="3" strokeLinecap="round" />
          <line className="streak-burst-ray" x1="14" y1="62" x2="4" y2="62" stroke="#ffb703" strokeWidth="3" strokeLinecap="round" />
          {BURST_SPARKS.map((spark, index) => (
            <path
              key={index}
              className="streak-burst-spark"
              d={`M ${spark.cx} ${spark.cy - spark.size} L ${spark.cx + spark.size * 0.36} ${spark.cy - spark.size * 0.36} L ${spark.cx + spark.size} ${spark.cy} L ${spark.cx + spark.size * 0.36} ${spark.cy + spark.size * 0.36} L ${spark.cx} ${spark.cy + spark.size} L ${spark.cx - spark.size * 0.36} ${spark.cy + spark.size * 0.36} L ${spark.cx - spark.size} ${spark.cy} L ${spark.cx - spark.size * 0.36} ${spark.cy - spark.size * 0.36} Z`}
              fill={spark.color}
              style={{
                ['--tx' as string]: spark.tx,
                ['--ty' as string]: spark.ty,
                ['--rot' as string]: spark.rot,
              }}
            />
          ))}
        </g>

        <g className="streak-flame-body">
          <path
            d="M60 15C60 15 74.5 29 75.5 42C76 46 74.2 49.5 71.5 52C81.5 44.5 93 53.5 93 69.5C93 89.2 78.4 102 60 102C41.6 102 27 89.2 27 69.5C27 53.5 38.5 44.5 48.5 52C45.8 49.5 44 46 44.5 42C45.5 29 60 15 60 15Z"
            fill={`url(#${outerId})`}
            stroke="#c93900"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          <path
            className="streak-flame-core"
            d="M60 40C60 40 70 49.5 70.6 58.2C71 60.8 69.6 63 67.6 64.8C74.2 59.8 82 65.5 82 76.2C82 88.8 72.2 96.5 60 96.5C47.8 96.5 38 88.8 38 76.2C38 65.5 45.8 59.8 52.4 64.8C50.4 63 49 60.8 49.4 58.2C50 49.5 60 40 60 40Z"
            fill={`url(#${innerId})`}
          />

          {/* Tiny golden crown for 1k+ streak club */}
          <path
            d="M49 28L53 19L60 24L67 19L71 28Z"
            fill="#ffd43b"
            stroke="#b45309"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Expressive Duolingo-style mascot face */}
          <g className="streak-mascot-face">
            <g className="streak-eye-blink">
              <circle cx="51.5" cy="69" r="3.4" fill="#3a1900" />
              <circle cx="68.5" cy="69" r="3.4" fill="#3a1900" />
              <circle cx="50.4" cy="67.7" r="1.2" fill="#ffffff" />
              <circle cx="67.4" cy="67.7" r="1.2" fill="#ffffff" />
            </g>
            <ellipse cx="44.5" cy="74.5" rx="3.3" ry="1.9" fill="#ff5a1f" fillOpacity="0.45" />
            <ellipse cx="75.5" cy="74.5" rx="3.3" ry="1.9" fill="#ff5a1f" fillOpacity="0.45" />
            <path
              d="M54.5 75.5C56.2 78.6 63.8 78.6 65.5 75.5"
              stroke="#3a1900"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        </g>

        <path
          className="streak-ambient-spark"
          d="M25 36L27 40L31 42L27 44L25 48L23 44L19 42L23 40Z"
          fill="#ffd43b"
        />
        <circle className="streak-ambient-spark streak-ambient-spark-2" cx="95" cy="41" r="3.2" fill="#ff9600" />
        <circle className="streak-ambient-spark streak-ambient-spark-3" cx="91" cy="87" r="2.6" fill="#ffd43b" />
      </svg>
    </div>
  )
}

export function LanguagesCard({ standalone = false }: { standalone?: boolean }) {
  const [celebrating, setCelebrating] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const triggerCelebration = () => {
    setBurstKey((k) => k + 1)
    setCelebrating(true)
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(() => {
      setCelebrating(false)
    }, 820)
  }

  return (
    <BentoCardWrapper
      className="bento-card-languages"
      standalone={standalone}
      onMouseEnter={triggerCelebration}
    >
      <div className="bento-languages-content">
        <div className="about-lang-header">
          <span className="about-eyebrow">Languages</span>
          <h3 className="bento-card-title">I speak</h3>
          <div className="about-lang-pills">
            <span className="about-lang-pill">English</span>
            <span className="about-lang-pill">Chinese</span>
            <span className="about-lang-pill about-lang-pill-learning">Spanish · learning</span>
          </div>
        </div>

        <button
          type="button"
          className={`about-streak-stage ${celebrating ? 'is-celebrating' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            triggerCelebration()
          }}
          aria-label="1,000 plus day Duolingo Spanish streak. Click to replay celebration."
        >
          <StreakMascotArt burstKey={burstKey} />
          <div className="about-streak-copy">
            <span className="about-streak-eyebrow">Duolingo · Streak Society</span>
            <div className="about-streak-figure">
              <span className="about-streak-number">1,000+</span>
              <span className="about-streak-unit">days</span>
            </div>
            <p className="about-streak-sub">Spanish daily practice</p>
            <div className="about-streak-week" aria-hidden="true">
              {STREAK_DAYS.map((day, index) => (
                <span
                  key={index}
                  className="about-streak-day"
                  style={{ ['--day-i' as string]: index }}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        </button>
      </div>
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
