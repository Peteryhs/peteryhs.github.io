import { type ReactNode, type MouseEvent, useRef, useEffect, useCallback } from 'react'
import { BlurFade } from './BlurFade'

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
        <div className="bento-photo-container">
          <img
            src="/peter-photo.jpg"
            alt="Peter Shao"
            className="bento-profile-img"
            loading="lazy"
          />
        </div>
        <div className="bento-profile-info">
          <h3 className="bento-card-title">Peter Shao</h3>
          <p className="bento-card-subtitle">Toronto, Canada | CE @ uWaterloo</p>
          <p className="bento-card-body">
            I love building soft/hardware projects that people find value in.
          </p>
          <div className="bento-freetime">
            <span className="bento-freetime-label">In my freetime, I am a:</span>
            <div className="bento-focus-list bento-freetime-list">
              <div className="bento-focus-row">
                <span className="bento-focus-bullet">-</span>
                <div className="bento-focus-text">
                  <span className="bento-focus-name">Homelab Nerd</span>
                </div>
              </div>
              <div className="bento-focus-row">
                <span className="bento-focus-bullet">-</span>
                <div className="bento-focus-text">
                  <span className="bento-focus-name">Audio/camera aficionado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BentoCardWrapper>
  )
}

function FlameStreakIcon() {
  return (
    <span className="bento-fire-badge" aria-label="Duolingo flame streak">
      <svg
        className="bento-fire-svg"
        viewBox="0 0 44 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fireOuterGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#d92200" />
            <stop offset="35%" stopColor="#f54700" />
            <stop offset="75%" stopColor="#ff8c00" />
            <stop offset="100%" stopColor="#ffc72c" />
          </linearGradient>
          <linearGradient id="fireInnerGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ff5900" />
            <stop offset="50%" stopColor="#ffb703" />
            <stop offset="100%" stopColor="#fff3b0" />
          </linearGradient>
        </defs>

        {/* Rounder Plump Outer Flame */}
        <path
          className="flame-outer"
          d="M22 2.5C22 2.5 28.5 10 29 15.8C29.4 17.4 28.6 18.8 27.2 20C32 16.5 38 20.5 38 28.5C38 38.8 30.8 46 22 46C13.2 46 6 38.8 6 28.5C6 20.5 12 16.5 16.8 20C15.4 18.8 14.6 17.4 15 15.8C15.5 10 22 2.5 22 2.5Z"
          fill="url(#fireOuterGrad)"
        />

        {/* Inner Flame Core */}
        <path
          className="flame-inner"
          d="M22 13.5C22 13.5 26.5 18.5 26.8 22.5C27.1 23.6 26.3 24.6 25.4 25.4C28.8 23 33 25.5 33 31C33 38.5 28 43 22 43C16 43 11 38.5 11 31C11 25.5 15.2 23 18.6 25.4C17.7 24.6 16.9 23.6 17.2 22.5C17.5 18.5 22 13.5 22 13.5Z"
          fill="url(#fireInnerGrad)"
        />
      </svg>
    </span>
  )
}

interface FireParticle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  rotation: number
  vRot: number
  life: number
  maxLife: number
  decay: number
  shape: 'ember' | 'spark' | 'flame'
}

export function LanguagesCard({ standalone = false }: { standalone?: boolean }) {
  const cardRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fireRef = useRef<HTMLSpanElement>(null)
  const particlesRef = useRef<FireParticle[]>([])
  const animIdRef = useRef<number | null>(null)
  const lastBurstTimeRef = useRef(0)

  const triggerExplosion = useCallback(() => {
    const card = cardRef.current
    const canvas = canvasRef.current
    const fire = fireRef.current
    if (!card || !canvas || !fire) return

    const now = performance.now()
    if (now - lastBurstTimeRef.current < 160) return
    lastBurstTimeRef.current = now

    const cardRect = card.getBoundingClientRect()
    const fireRect = fire.getBoundingClientRect()

    const dpr = window.devicePixelRatio || 1
    const width = cardRect.width
    const height = cardRect.height

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
    }

    const originX = fireRect.left + fireRect.width / 2 - cardRect.left
    const originY = fireRect.top + fireRect.height / 2 - cardRect.top

    // Generate burst of fire particles
    const particleCount = 34
    const newParticles: FireParticle[] = []

    for (let i = 0; i < particleCount; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.95)
      const speed = Math.random() * 5.4 + 2.2
      const maxLife = Math.random() * 45 + 50
      const shapes: ('ember' | 'spark' | 'flame')[] = ['flame', 'flame', 'ember', 'ember', 'spark']
      const shape = shapes[Math.floor(Math.random() * shapes.length)]

      newParticles.push({
        x: originX + (Math.random() - 0.5) * 12,
        y: originY + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: shape === 'spark' ? Math.random() * 2 + 1.2 : Math.random() * 2.8 + 1.6,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
        life: maxLife,
        maxLife,
        decay: 1,
        shape,
      })
    }

    particlesRef.current.push(...newParticles)

    if (!animIdRef.current) {
      const tick = () => {
        const cvs = canvasRef.current
        const crd = cardRef.current
        if (!cvs || !crd) {
          animIdRef.current = null
          return
        }

        const ctx = cvs.getContext('2d')
        if (!ctx) {
          animIdRef.current = null
          return
        }

        const cardH = crd.clientHeight
        const groundY = cardH - 6

        ctx.clearRect(0, 0, cvs.width, cvs.height)
        ctx.save()
        ctx.scale(dpr, dpr)

        const particles = particlesRef.current

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]

          // Physics update
          p.vy += 0.28 // gravity
          p.vx *= 0.985 // drag
          p.x += p.vx
          p.y += p.vy
          p.rotation += p.vRot

          // Floor bounce
          if (p.y >= groundY) {
            p.y = groundY
            p.vy = -p.vy * (0.34 + Math.random() * 0.08)
            p.vx *= 0.62
            if (Math.abs(p.vy) < 0.45) {
              p.vy = 0
            }
          }

          p.life -= p.decay

          if (p.life <= 0) {
            particles.splice(i, 1)
            continue
          }

          // Render particle
          const progress = p.life / p.maxLife
          const alpha = Math.min(1, progress * 1.3)
          const r = p.radius * (0.45 + progress * 0.55)

          let fillColor = `rgba(255, 100, 10, ${alpha})`
          if (progress > 0.65) {
            fillColor = `rgba(255, 225, 75, ${alpha})`
          } else if (progress > 0.3) {
            fillColor = `rgba(255, 88, 12, ${alpha})`
          } else {
            fillColor = `rgba(185, 30, 8, ${alpha})`
          }

          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)
          ctx.fillStyle = fillColor
          ctx.shadowColor = `rgba(255, 80, 0, ${alpha * 0.55})`
          ctx.shadowBlur = 4

          if (p.shape === 'flame') {
            ctx.beginPath()
            ctx.moveTo(0, -r * 1.5)
            ctx.bezierCurveTo(r * 1.2, -r * 0.4, r, r, 0, r)
            ctx.bezierCurveTo(-r, r, -r * 1.2, -r * 0.4, 0, -r * 1.5)
            ctx.fill()
          } else if (p.shape === 'spark') {
            ctx.beginPath()
            ctx.moveTo(0, -r * 1.6)
            ctx.lineTo(r * 0.4, 0)
            ctx.lineTo(0, r * 1.6)
            ctx.lineTo(-r * 0.4, 0)
            ctx.closePath()
            ctx.fill()
          } else {
            ctx.beginPath()
            ctx.arc(0, 0, r, 0, Math.PI * 2)
            ctx.fill()
          }

          ctx.restore()
        }

        ctx.restore()

        if (particles.length > 0) {
          animIdRef.current = requestAnimationFrame(tick)
        } else {
          animIdRef.current = null
        }
      }

      animIdRef.current = requestAnimationFrame(tick)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current)
      }
    }
  }, [])

  return (
    <BentoCardWrapper
      className="bento-card-languages"
      standalone={standalone}
      cardRef={cardRef}
      onMouseEnter={triggerExplosion}
    >
      <canvas ref={canvasRef} className="bento-particles-canvas" aria-hidden="true" />
      <div className="bento-languages-content">
        <h3 className="bento-card-title">I speak:</h3>
        <p className="bento-lang-primary">Chinese and English</p>
        <div className="bento-streak-box">
          <p className="bento-lang-secondary">Currently learning Spanish via Duolingo</p>
          <div className="bento-streak-row" aria-label="I have a 1k plus Duolingo streak">
            <span>I have a</span>
            {' '}
            <span
              ref={fireRef}
              className="bento-streak-badge-group"
              onMouseEnter={triggerExplosion}
              onClick={triggerExplosion}
            >
              <span className="bento-streak-count">1k+</span>
              <FlameStreakIcon />
            </span>
            {' '}
            <span>streak</span>
          </div>
        </div>
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
            src="/waterloo-crest.png"
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
            Awesome school with the largest co-op program in NA. I am learning & applying my skills
            in the workforce here.
          </p>
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
