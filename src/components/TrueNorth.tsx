import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { BlurFade } from './BlurFade'
import { CompassRose } from './CompassRose'

interface TrueNorthItem {
  year: string
  title: string
  body: string
}

const trueNorthItems: TrueNorthItem[] = [
  {
    year: '2018',
    title: 'Electronics',
    body: 'Technology does incredible things, but they are also flawed. I want to understand them, and improve them for myself and others.',
  },
  {
    year: '2022',
    title: 'Distributed systems',
    body: 'A simple Linux server on my laptop grew into a stack that hosts everything I use. I want to build systems that serve the people around me, not just myself.',
  },
  {
    year: '2023',
    title: 'Machine learning',
    body: "Google's magic erase sparked my interest in AI, LLMs got me into the research papers, not just the models. I want to understand them, and improve their methodology and practicality.",
  },
]

function TrueNorthCard({
  children,
  className = '',
  onMouseEnter,
  onMouseLeave,
  onClick,
  innerRef,
  dataYear,
}: {
  children: React.ReactNode
  className?: string
  onMouseEnter?: (e: MouseEvent<HTMLElement>) => void
  onMouseLeave?: (e: MouseEvent<HTMLElement>) => void
  onClick?: () => void
  innerRef?: React.Ref<HTMLElement>
  dataYear?: string
}) {
  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`)
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`)
  }

  return (
    <article
      ref={innerRef}
      data-year={dataYear}
      className={`bento-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div className="bento-card-spotlight" aria-hidden="true" />
      <div className="bento-card-content">{children}</div>
    </article>
  )
}

export function TrueNorthTimeline({
  filterKey,
  onHoverYear,
  registerCardRef,
}: {
  filterKey?: 'electronics' | 'systems' | 'ml'
  onHoverYear?: (year: string) => void
  registerCardRef?: (year: string, el: HTMLElement | null) => void
}) {
  const items = filterKey
    ? trueNorthItems.filter((item) => {
        if (filterKey === 'electronics') return item.year === '2018'
        if (filterKey === 'systems') return item.year === '2022'
        if (filterKey === 'ml') return item.year === '2023'
        return true
      })
    : trueNorthItems

  return (
    <div className="truenorth-timeline-container" aria-label="True North timeline">
      {/* Continuous Vertical Timeline Spine */}
      <div className="truenorth-spine" aria-hidden="true" />

      {items.map((item, idx) => (
        <BlurFade
          key={item.year}
          delay={filterKey ? 0.04 : 0.16 + idx * 0.1}
          duration={0.45}
          yOffset={10}
          inViewMargin="-50px"
        >
          <div
            className="truenorth-timeline-item"
            onMouseEnter={() => onHoverYear?.(item.year)}
          >
            {/* Horizontal branch stem connecting timeline spine to card */}
            <div className="truenorth-stem" aria-hidden="true" />

            {/* Year Node Badge on Timeline Spine */}
            <div className="truenorth-year-node" aria-label={`Year ${item.year}`}>
              <span className="truenorth-year-text">{item.year}</span>
            </div>

            {/* Passion Card */}
            <TrueNorthCard
              className="truenorth-card"
              dataYear={item.year}
              innerRef={(el) => registerCardRef?.(item.year, el)}
              onMouseEnter={() => onHoverYear?.(item.year)}
              onClick={() => onHoverYear?.(item.year)}
            >
              <h3 className="truenorth-card-title">{item.title}</h3>
              <p className="truenorth-card-body">{item.body}</p>
            </TrueNorthCard>
          </div>
        </BlurFade>
      ))}
    </div>
  )
}

export function TrueNorthSection() {
  const [targetAngle, setTargetAngle] = useState(0)
  const compassRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLElement | null>>({})

  const calculateAngleForYear = useCallback((year: string) => {
    const cardEl = cardRefs.current[year]
    const compassEl = compassRef.current
    if (!cardEl || !compassEl) {
      if (year === '2018') return -65
      if (year === '2022') return -90
      if (year === '2023') return -118
      return 0
    }
    const compassRect = compassEl.getBoundingClientRect()
    const cardRect = cardEl.getBoundingClientRect()
    const cx = compassRect.left + compassRect.width / 2
    const cy = compassRect.top + compassRect.height / 2
    const tx = cardRect.left + cardRect.width / 2
    const ty = cardRect.top + cardRect.height / 2
    const dx = tx - cx
    const dy = ty - cy
    // In SVG coordinate space, 0 deg is North (-Y). Math.atan2(dx, -dy) gives angle in rad from top.
    const rad = Math.atan2(dx, -dy)
    return (rad * 180) / Math.PI
  }, [])

  const handleHoverYear = useCallback(
    (year: string) => {
      const angle = calculateAngleForYear(year)
      setTargetAngle(angle)
    },
    [calculateAngleForYear]
  )

  const registerCardRef = useCallback((year: string, el: HTMLElement | null) => {
    cardRefs.current[year] = el
  }, [])

  // Auto-snap needle to visible card as user scrolls through True North
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const year = entry.target.getAttribute('data-year')
            if (year) {
              setTargetAngle(calculateAngleForYear(year))
            }
          }
        })
      },
      {
        rootMargin: '-15% 0px -25% 0px',
        threshold: 0.4,
      }
    )

    Object.entries(cardRefs.current).forEach(([_, el]) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [calculateAngleForYear])

  return (
    <div className="truenorth-section-outer">
      {/* Full-bleed background layer spanning 100vw with top/bottom smooth gradient mask */}
      <div className="truenorth-compass-bg-outer" aria-hidden="true">
        <div className="truenorth-compass-positioner" ref={compassRef}>
          <CompassRose size="100%" angle={targetAngle} />
        </div>
      </div>

      <section
        className="longform-section truenorth-section"
        id="truenorth"
        aria-labelledby="truenorth-heading"
      >
        <div className="truenorth-content-wrap">
          {/* Heading */}
          <BlurFade delay={0.06} duration={0.5} yOffset={10}>
            <h2 id="truenorth-heading" className="longform-heading">
              True North
            </h2>
          </BlurFade>

          {/* Intro Purpose Card */}
          <BlurFade delay={0.12} duration={0.5} yOffset={10}>
            <div className="truenorth-intro-wrap">
              <TrueNorthCard className="truenorth-intro-card">
                <p className="truenorth-intro-text">
                  After six years of engineering, I found a few topics I'm truly passionate about.
                </p>
              </TrueNorthCard>
            </div>
          </BlurFade>

          {/* Timeline Section */}
          <TrueNorthTimeline
            onHoverYear={handleHoverYear}
            registerCardRef={registerCardRef}
          />
        </div>
      </section>
    </div>
  )
}
