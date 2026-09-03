import { type ReactNode, type MouseEvent } from 'react'
import { BlurFade } from './BlurFade'

interface BentoCardProps {
  children: ReactNode
  className?: string
  standalone?: boolean
}

function BentoCardWrapper({ children, className = '', standalone = false }: BentoCardProps) {
  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`)
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`)
  }

  return (
    <article
      className={`bento-card ${className} ${standalone ? 'is-standalone' : ''}`}
      onMouseMove={handleMouseMove}
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
            <ul className="bento-freetime-list">
              <li>Homelab Nerd</li>
              <li>Audio/camera aficionado</li>
            </ul>
          </div>
        </div>
      </div>
    </BentoCardWrapper>
  )
}

export function LanguagesCard({ standalone = false }: { standalone?: boolean }) {
  return (
    <BentoCardWrapper className="bento-card-languages" standalone={standalone}>
      <div className="bento-languages-content">
        <h3 className="bento-card-title">I speak:</h3>
        <p className="bento-lang-primary">Chinese and English</p>
        <div className="bento-streak-box">
          <p className="bento-lang-secondary">Learning Spanish with a 1k+ streak</p>
          <span className="bento-streak-badge">1,000+ day streak</span>
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
