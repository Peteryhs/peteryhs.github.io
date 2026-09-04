import { type MouseEvent } from 'react'
import { BlurFade } from './BlurFade'

interface TrueNorthItem {
  year: string
  title: string
  body: string
}

const trueNorthItems: TrueNorthItem[] = [
  {
    year: '2018',
    title: 'Electronics',
    body: 'My first laptop in 2018 came with a broken hard drive, and it sparked my fascination with tech: how incredible but also how fragile and illogical it can be. So I customize every piece of tech I own, hardware and software, to my needs, most recently a camera I programmed myself for a simple and pure experience.',
  },
  {
    year: '2022',
    title: 'Distributed systems',
    body: 'I started self-hosting with a simple Linux server on my laptop, and the freedom of running any service I wanted made the stack stick and grow into a complex system over the years. Today my skills reach beyond my own use, to the people around me and others on the internet.',
  },
  {
    year: '2023',
    title: 'Machine learning',
    body: "Google's Magic Eraser first got me fascinated with ML, and when generative AI arrived I used the models, but also explored the research papers to understand how they work. Just like with electronics, I customized and fine-tuned models myself, which led to my AI-text detector: trained from published research but with a fraction of the cost.",
  },
]

function TrueNorthCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`)
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`)
  }

  return (
    <article className={`bento-card ${className}`} onMouseMove={handleMouseMove}>
      <div className="bento-card-spotlight" aria-hidden="true" />
      <div className="bento-card-content">{children}</div>
    </article>
  )
}

export function TrueNorthTimeline({
  filterKey,
}: {
  filterKey?: 'electronics' | 'systems' | 'ml'
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
          <div className="truenorth-timeline-item">
            {/* Horizontal branch stem connecting timeline spine to card */}
            <div className="truenorth-stem" aria-hidden="true" />

            {/* Year Node Badge on Timeline Spine */}
            <div className="truenorth-year-node" aria-label={`Year ${item.year}`}>
              <span className="truenorth-year-text">{item.year}</span>
            </div>

            {/* Passion Card */}
            <TrueNorthCard className="truenorth-card">
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
  return (
    <section
      className="longform-section truenorth-section"
      id="truenorth"
      aria-labelledby="truenorth-heading"
    >
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
      <TrueNorthTimeline />
    </section>
  )
}
