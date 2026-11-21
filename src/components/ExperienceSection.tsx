import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { BlurFade } from './BlurFade'
import { CompassRose } from './CompassRose'

export type ExperienceId = 'next' | 'watcloud' | 'hacktheridge'

export interface ExperienceItem {
  id: ExperienceId
  nodeLabel: string
  org: string
  role: string
  period: string
  location: string
  summary: string
  highlights?: string[]
  tags?: string[]
  status?: 'current' | 'upcoming' | 'past'
}

export const experienceItems: ExperienceItem[] = [
  {
    id: 'next',
    nodeLabel: 'Next',
    org: 'Seeking Co-op',
    role: 'Software & Infrastructure Engineering',
    period: 'Upcoming',
    location: 'Waterloo / Remote',
    summary:
      'Looking for my next engineering co-op term building distributed systems, cloud infrastructure, or applied ML.',
    status: 'upcoming',
  },
  {
    id: 'watcloud',
    nodeLabel: 'Now',
    org: 'WATonomous',
    role: 'Infrastructure Engineer · WATcloud',
    period: 'Sep 2026 – Present',
    location: 'Waterloo, ON',
    summary:
      'Operate production Slurm, Kubernetes, and Proxmox infrastructure serving 22 teams, labs, and course groups via Terraform, Ansible, and GitHub Actions.',
    highlights: [
      'Root-caused recurring Terraform CI deadlocks by correlating GitHub Actions and Slurm logs, isolating mid-apply runner preemptions that stranded Azure Blob state locks.',
      'Triaged on-call Prometheus alerts across vCluster and network targets, and hardened onboarding workflows with single-sourced configs and Sentry monitoring.',
      'Designed an XFS project-quota overhaul to govern 60+ TB of shared cluster storage, backed by Slurm usage audits and Ansible provisioning.',
    ],
    tags: ['Slurm', 'Kubernetes', 'Proxmox', 'Terraform', 'Ansible', 'Prometheus'],
    status: 'current',
  },
  {
    id: 'hacktheridge',
    nodeLabel: 'HTR',
    org: 'Hack the Ridge',
    role: 'Director of Web Development & Brand Design',
    period: 'Sep 2024 – Jun 2026',
    location: 'Oakville, ON',
    summary: 'Led software development and brand design for a hackathon serving 150+ participants.',
    highlights: [
      'Architected the event web stack: landing page, backend SMTP mail, and DNS/domain infrastructure.',
      'Contributed to 2× registration growth by modernizing the web platform and visual identity.',
    ],
    tags: ['Web Development', 'Brand Design', 'SMTP', 'DNS'],
    status: 'past',
  },
]

function fallbackAngleForId(id: ExperienceId) {
  if (id === 'next') return -62
  if (id === 'watcloud') return -90
  if (id === 'hacktheridge') return -118
  return 0
}

function ExperienceCard({
  children,
  className = '',
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  onClick,
  interactive = false,
  ariaLabel,
  innerRef,
  dataExpId,
}: {
  children: React.ReactNode
  className?: string
  onMouseEnter?: (e: MouseEvent<HTMLElement>) => void
  onMouseLeave?: (e: MouseEvent<HTMLElement>) => void
  onMouseMove?: (e: MouseEvent<HTMLElement>) => void
  onClick?: () => void
  interactive?: boolean
  ariaLabel?: string
  innerRef?: React.Ref<HTMLElement>
  dataExpId?: string
}) {
  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`)
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`)
    onMouseMove?.(e)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    onClick?.()
  }

  return (
    <article
      ref={innerRef}
      data-exp-id={dataExpId}
      className={`bento-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      {...(interactive && {
        role: 'link',
        tabIndex: 0,
        'aria-label': ariaLabel,
        onKeyDown: handleKeyDown,
      })}
    >
      <div className="bento-card-spotlight" aria-hidden="true" />
      <div className="bento-card-content">{children}</div>
    </article>
  )
}

export function ExperienceTimeline({
  filterId,
  onHoverId,
  onManualHoverId,
  onLeaveId,
  registerCardRef,
}: {
  filterId?: 'watcloud' | 'hacktheridge'
  onHoverId?: (id: ExperienceId) => void
  onManualHoverId?: (id: ExperienceId) => void
  onLeaveId?: () => void
  registerCardRef?: (id: ExperienceId, el: HTMLElement | null) => void
}) {
  const items = filterId
    ? experienceItems.filter((item) => item.id === filterId)
    : experienceItems

  return (
    <div className="truenorth-timeline-container exp-timeline-container" aria-label="Experience timeline">
      <div className="truenorth-spine" aria-hidden="true" />

      {items.map((item, idx) => {
        const isCurrent = item.status === 'current'
        const isUpcoming = item.status === 'upcoming'

        return (
          <BlurFade
            key={item.id}
            delay={filterId ? 0.04 : 0.14 + idx * 0.1}
            duration={0.45}
            yOffset={10}
            inViewMargin="-50px"
          >
            <div className={`truenorth-timeline-item ${isUpcoming ? 'exp-item-upcoming' : ''}`}>
              <div className="truenorth-stem" aria-hidden="true" />

              <div
                className="truenorth-year-node"
                aria-label={`${item.org} — ${item.period}`}
                onMouseEnter={() => onHoverId?.(item.id)}
                onMouseMove={() => onManualHoverId?.(item.id)}
                onMouseLeave={onLeaveId}
              >
                <span
                  className={`truenorth-year-text ${isCurrent ? 'exp-node-current' : ''} ${isUpcoming ? 'exp-node-upcoming' : ''}`}
                >
                  {isCurrent && <span className="exp-live-dot" aria-hidden="true" />}
                  {item.nodeLabel}
                </span>
              </div>

              <ExperienceCard
                className={`truenorth-card exp-card ${isUpcoming ? 'exp-card-upcoming' : ''} ${filterId ? 'is-clickable' : ''}`}
                dataExpId={item.id}
                innerRef={(el) => registerCardRef?.(item.id, el)}
                onMouseEnter={() => onHoverId?.(item.id)}
                onMouseMove={() => onManualHoverId?.(item.id)}
                onMouseLeave={onLeaveId}
                interactive={!!filterId}
                ariaLabel={`${item.org}: view in Experience section`}
                onClick={() => {
                  onHoverId?.(item.id)
                  if (filterId) {
                    document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
              >
                <div className="exp-card-header">
                  <div className="exp-card-titles">
                    <h3 className="truenorth-card-title exp-card-org">{item.org}</h3>
                    <p className="exp-card-role">{item.role}</p>
                  </div>
                  <div className="exp-card-meta">
                    <span className="exp-card-period">{item.period}</span>
                    <span className="exp-card-location">{item.location}</span>
                  </div>
                </div>

                <p className="truenorth-card-body exp-card-summary">{item.summary}</p>

                {item.highlights && item.highlights.length > 0 && (
                  <ul className="exp-highlights">
                    {item.highlights.map((bullet, bIdx) => (
                      <li key={bIdx} className="exp-highlight-item">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="exp-tags" aria-label="Skills and areas">
                    {item.tags.map((tag) => (
                      <span key={tag} className="exp-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </ExperienceCard>
            </div>
          </BlurFade>
        )
      })}
    </div>
  )
}

export function ExperienceSection() {
  const [targetAngle, setTargetAngle] = useState(fallbackAngleForId('watcloud'))
  const [activeId, setActiveId] = useState<ExperienceId>('watcloud')
  const compassRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Partial<Record<ExperienceId, HTMLElement | null>>>({})
  const isManualHoverRef = useRef(false)
  const pointerPositionRef = useRef({ x: -1, y: -1 })
  const rafRef = useRef<number | null>(null)
  const { scrollY } = useScroll()

  const calculateAngleForId = useCallback((id: ExperienceId) => {
    const cardEl = cardRefs.current[id]
    const compassEl = compassRef.current
    if (!cardEl || !compassEl) {
      return fallbackAngleForId(id)
    }
    const compassRect = compassEl.getBoundingClientRect()
    const cardRect = cardEl.getBoundingClientRect()
    const cx = compassRect.left + compassRect.width / 2
    const cy = compassRect.top + compassRect.height / 2
    const tx = cardRect.left + cardRect.width / 2
    const ty = cardRect.top + cardRect.height / 2
    const dx = tx - cx
    const dy = ty - cy
    const rad = Math.atan2(dx, -dy)
    return (rad * 180) / Math.PI
  }, [])

  const syncCompassToId = useCallback(
    (id: ExperienceId) => {
      const angle = calculateAngleForId(id)
      setTargetAngle(angle)
      setActiveId(id)
    },
    [calculateAngleForId]
  )

  const handleHoverId = useCallback(
    (id: ExperienceId) => {
      syncCompassToId(id)
    },
    [syncCompassToId]
  )

  const handleManualHoverId = useCallback(
    (id: ExperienceId) => {
      isManualHoverRef.current = true
      syncCompassToId(id)
    },
    [syncCompassToId]
  )

  const getClosestVisibleId = useCallback((): ExperienceId => {
    const viewportTargetY = window.innerHeight * 0.52
    let bestId: ExperienceId = activeId
    let bestDistance = Infinity

    experienceItems.forEach((item) => {
      const el =
        cardRefs.current[item.id] ??
        document.querySelector<HTMLElement>(`.exp-card[data-exp-id="${item.id}"]`)
      if (!el) return

      const rect = el.getBoundingClientRect()
      const visibleTop = Math.max(rect.top, 0)
      const visibleBottom = Math.min(rect.bottom, window.innerHeight)
      const visibleHeight = Math.max(0, visibleBottom - visibleTop)

      if (visibleHeight < Math.min(rect.height * 0.22, 42)) return

      const cardCenter = rect.top + rect.height / 2
      const distance = Math.abs(cardCenter - viewportTargetY)

      if (distance < bestDistance) {
        bestDistance = distance
        bestId = item.id
      }
    })

    return bestId
  }, [activeId])

  const isPointerOverManualTarget = useCallback(() => {
    const { x, y } = pointerPositionRef.current
    if (x < 0 || y < 0) return false
    const hoverTarget = document.elementFromPoint(x, y)
    return Boolean(hoverTarget?.closest('.exp-card, .truenorth-year-node'))
  }, [])

  const syncCompassToScroll = useCallback(() => {
    if (isManualHoverRef.current && isPointerOverManualTarget()) return
    isManualHoverRef.current = false
    syncCompassToId(getClosestVisibleId())
  }, [getClosestVisibleId, isPointerOverManualTarget, syncCompassToId])

  const handleLeaveId = useCallback(() => {
    isManualHoverRef.current = false
    syncCompassToScroll()
  }, [syncCompassToScroll])

  useMotionValueEvent(scrollY, 'change', () => {
    if (rafRef.current !== null) return
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      syncCompassToScroll()
    })
  })

  const registerCardRef = useCallback((id: ExperienceId, el: HTMLElement | null) => {
    cardRefs.current[id] = el
  }, [])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      pointerPositionRef.current = { x: event.clientX, y: event.clientY }
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  useEffect(() => {
    syncCompassToId(activeId)

    const handleResize = () => {
      if (isManualHoverRef.current) {
        syncCompassToId(activeId)
        return
      }
      syncCompassToScroll()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeId, syncCompassToScroll, syncCompassToId])

  useEffect(() => {
    const queueScrollSync = () => {
      if (rafRef.current !== null) return
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null
        syncCompassToScroll()
      })
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          queueScrollSync()
        }
      },
      {
        rootMargin: '-15% 0px -25% 0px',
        threshold: 0.4,
      }
    )

    Object.values(cardRefs.current).forEach((el) => {
      if (el) observer.observe(el)
    })

    window.addEventListener('scroll', queueScrollSync, { passive: true })
    document.addEventListener('scroll', queueScrollSync, { passive: true, capture: true })
    queueScrollSync()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', queueScrollSync)
      document.removeEventListener('scroll', queueScrollSync, { capture: true })
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [syncCompassToScroll])

  return (
    <div className="truenorth-section-outer">
      <div className="truenorth-compass-bg-outer" aria-hidden="true">
        <div className="truenorth-compass-positioner" ref={compassRef}>
          <CompassRose size="100%" angle={targetAngle} />
        </div>
      </div>

      <section
        className="longform-section truenorth-section"
        id="experience"
        aria-labelledby="experience-heading"
      >
        <div className="truenorth-content-wrap">
          <BlurFade delay={0.06} duration={0.5} yOffset={10}>
            <h2 id="experience-heading" className="longform-heading">
              Experience
            </h2>
          </BlurFade>

          <ExperienceTimeline
            onHoverId={handleHoverId}
            onManualHoverId={handleManualHoverId}
            onLeaveId={handleLeaveId}
            registerCardRef={registerCardRef}
          />
        </div>
      </section>
    </div>
  )
}
