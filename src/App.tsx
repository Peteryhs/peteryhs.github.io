import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useState, useRef, useEffect } from 'react'
import {
  AboutBentoGrid,
  ProfileCard,
  LanguagesCard,
  WaterlooCard,
  CompEngFocusCard,
} from './components/AboutBento'
import { BlurFade } from './components/BlurFade'
import {
  CursorFollower,
  type CursorFollowerRef,
  type CursorInfo,
} from './components/CursorFollower'
import { DemoIcon } from './components/DemoIcon'
import { InteractiveGridPattern } from './components/InteractiveGridPattern'
import { TrueNorthSection, TrueNorthTimeline } from './components/TrueNorth'
import { topicById, type Topic, type TopicId } from './content/site'

const ease = [0.16, 1, 0.3, 1] as const

interface TopicWordProps {
  id: TopicId
  children: ReactNode
  activeId: TopicId | null
  onSelect: (id: TopicId) => void
  onHover: (info: CursorInfo | null, e?: React.MouseEvent) => void
  customInfo?: Partial<CursorInfo>
}

function TopicWord({
  id,
  children,
  activeId,
  onSelect,
  onHover,
  customInfo,
}: TopicWordProps) {
  const topic = topicById[id]
  const expanded = activeId === id

  const info: CursorInfo = {
    title: customInfo?.title || topic.title,
    preview: customInfo?.preview || topic.preview,
    badge: customInfo?.badge || topic.shortTitle,
  }

  return (
    <span className="topic-wrap">
      <button
        type="button"
        className={`topic-word ${expanded ? 'is-active' : ''}`}
        aria-expanded={expanded}
        onClick={(e) => {
          e.stopPropagation()
          onHover(null)
          onSelect(id)
        }}
        onMouseEnter={(e) => {
          if (!expanded) {
            onHover(info, e)
          } else {
            onHover(null)
          }
        }}
        onMouseMove={(e) => {
          if (!expanded) {
            onHover(info, e)
          } else {
            onHover(null)
          }
        }}
        onMouseLeave={() => onHover(null)}
        onFocus={(e) => {
          if (!expanded) {
            const rect = e.currentTarget.getBoundingClientRect()
            onHover(info, { clientX: rect.right, clientY: rect.bottom } as any)
          }
        }}
        onBlur={() => onHover(null)}
      >
        {children}
      </button>
    </span>
  )
}

function ExpandedSection({ topic }: { topic: Topic }) {
  const renderContent = () => {
    switch (topic.id) {
      case 'about':
        return (
          <div className="expanded-cards-dual">
            <ProfileCard />
            <LanguagesCard />
          </div>
        )
      case 'truenorth':
        return (
          <div className="expanded-cards-single">
            <TrueNorthTimeline />
          </div>
        )
      case 'electronics':
        return (
          <div className="expanded-cards-single">
            <TrueNorthTimeline filterKey="electronics" />
          </div>
        )
      case 'systems':
        return (
          <div className="expanded-cards-single">
            <TrueNorthTimeline filterKey="systems" />
          </div>
        )
      case 'ml':
        return (
          <div className="expanded-cards-single">
            <TrueNorthTimeline filterKey="ml" />
          </div>
        )
      case 'waterloo':
        return (
          <div className="expanded-cards-single">
            <WaterlooCard />
          </div>
        )
      case 'compeng':
        return (
          <div className="expanded-cards-single">
            <CompEngFocusCard />
          </div>
        )
      default:
        return (
          <div className="expanded-items-grid">
            {topic.items?.map((item) => (
              <article key={item.title} className="bento-card">
                <h3 className="bento-card-title">{item.title}</h3>
                <p className="bento-card-body">{item.text}</p>
              </article>
            ))}
          </div>
        )
    }
  }

  return (
    <motion.section
      className="expanded-section"
      aria-label={topic.title}
      initial={{ opacity: 0, height: 0, filter: 'blur(8px)' }}
      animate={{
        opacity: 1,
        height: 'auto',
        filter: 'blur(0px)',
        transition: {
          height: { duration: 0.42, ease },
          opacity: { duration: 0.35, ease },
          filter: { duration: 0.35, ease },
        },
      }}
      exit={{
        opacity: 0,
        height: 0,
        filter: 'blur(8px)',
        transition: {
          height: { duration: 0.38, ease },
          opacity: { duration: 0.28, ease },
          filter: { duration: 0.28, ease },
        },
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="expanded-section-content">
        <BlurFade delay={0.04} duration={0.4} yOffset={10}>
          {renderContent()}
        </BlurFade>
      </div>
    </motion.section>
  )
}

function LongFormSection({ topicId }: { topicId: 'about' | 'projects' | 'passions' | 'contact' }) {
  const topic = topicById[topicId]
  const aboutRef = useRef<HTMLElement>(null)

  if (topicId === 'about') {
    return (
      <div className="about-section-outer" ref={aboutRef as any}>
        <InteractiveGridPattern sectionRef={aboutRef} />
        <section
          className="longform-section about-longform-section"
          id="about"
          aria-labelledby="about-heading"
        >
          <div className="about-longform-inner">
            <BlurFade delay={0.06} duration={0.5} yOffset={10}>
              <h2 id="about-heading" className="longform-heading">
                About Me
              </h2>
            </BlurFade>
            <AboutBentoGrid />
          </div>
        </section>
      </div>
    )
  }

  return (
    <BlurFade delay={0.1} inViewMargin="-60px">
      <section className="longform-section" id={topic.id} aria-labelledby={`${topic.id}-heading`}>
        <h2 id={`${topic.id}-heading`} className="longform-heading">{topic.title}</h2>
        <div className="longform-grid">
          {topic.items?.map((item) => (
            <article key={item.title} className="longform-card">
              <h3>
                {item.title}
                {item.tag && <small className="item-tag"> · {item.tag}</small>}
              </h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </BlurFade>
  )
}

export default function App() {
  const [activeId, setActiveId] = useState<TopicId | null>(null)
  const [cursorInfo, setCursorInfo] = useState<CursorInfo | null>(null)
  const cursorRef = useRef<CursorFollowerRef>(null)

  // Click anywhere outside expanded cards to animate them out
  useEffect(() => {
    if (!activeId) return

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest('.expanded-section') || target.closest('.topic-word')) {
        return
      }
      setActiveId(null)
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
    }
  }, [activeId])

  const toggleTopic = (id: TopicId) => {
    setCursorInfo(null)
    setActiveId((current) => (current === id ? null : id))
  }

  const handleHover = (info: CursorInfo | null, e?: React.MouseEvent) => {
    if (info && e) {
      cursorRef.current?.syncPosition(e.clientX, e.clientY)
    }
    setCursorInfo(info)
  }

  const word = (
    id: TopicId,
    children: ReactNode,
    customInfo?: Partial<CursorInfo>,
  ) => (
    <TopicWord
      id={id}
      activeId={activeId}
      onSelect={toggleTopic}
      onHover={handleHover}
      customInfo={customInfo}
    >
      {children}
    </TopicWord>
  )

  const showAfter = (...ids: TopicId[]) => {
    const topic = activeId && ids.includes(activeId) ? topicById[activeId] : null
    return (
      <AnimatePresence initial={false}>
        {topic && <ExpandedSection key={topic.id} topic={topic} />}
      </AnimatePresence>
    )
  }

  return (
    <main>
      <CursorFollower ref={cursorRef} activeInfo={cursorInfo} />

      <header className="intro" id="top">
        <div className="intro-container">
          <BlurFade delay={0.06} yOffset={12}>
            <p className="intro-sentence">
              Hi <DemoIcon kind="wave" />, I am{' '}
              {word(
                'about',
                <>
                  <span
                    className="profile-photo"
                    aria-label="Profile photo"
                    role="img"
                  />{' '}
                  Peter
                </>,
                {
                  title: 'Peter Shao',
                  badge: 'About Me',
                  preview:
                    'Toronto, Canada · CE @ uWaterloo · Building soft & hardware projects.',
                },
              )}
              .
            </p>
          </BlurFade>
          {showAfter('about')}

          <BlurFade delay={0.14} yOffset={12}>
            <p className="intro-sentence">
              A student at the{' '}
              {word(
                'waterloo',
                <>
                  Univ of Waterloo <DemoIcon kind="university" />
                </>,
                {
                  title: 'University of Waterloo',
                  badge: 'Education',
                  preview:
                    'First Year Computer Engineering with NA’s largest co-op program.',
                },
              )}{' '}
              studying{' '}
              {word(
                'compeng',
                <>
                  CompEng <DemoIcon kind="engineering" />
                </>,
                {
                  title: 'Computer Engineering',
                  badge: 'Focus',
                  preview:
                    'Distributed systems, applied ML & embedded electronics engineering.',
                },
              )}
              .
            </p>
          </BlurFade>
          {showAfter('waterloo', 'compeng')}

          <BlurFade delay={0.22} yOffset={12}>
            <p className="intro-sentence">
              I am passionate about{' '}
              {word(
                'systems',
                <>
                  distributed systems <DemoIcon kind="systems" />
                </>,
                {
                  title: 'Distributed Systems',
                  badge: 'True North · 2022',
                  preview:
                    'Self-hosting grown into complex systems reaching users across the internet.',
                },
              )}
              ,{' '}
              {word(
                'ml',
                <>
                  ML <DemoIcon kind="machine-learning" />
                </>,
                {
                  title: 'Machine Learning',
                  badge: 'True North · 2023',
                  preview:
                    'Reproducing research, fine-tuning models & cost-effective AI detectors.',
                },
              )}{' '}
              and{' '}
              {word(
                'electronics',
                <span className="no-wrap">
                  electronics <DemoIcon kind="electronics" />.
                </span>,
                {
                  title: 'Electronics & Hardware',
                  badge: 'True North · 2018',
                  preview:
                    'Customizing hardware & software, from broken laptops to custom-programmed cameras.',
                },
              )}
            </p>
          </BlurFade>
          {showAfter('systems', 'ml', 'electronics', 'truenorth')}

          <BlurFade delay={0.3} yOffset={12}>
            <p className="intro-sentence">
              I love making{' '}
              {word(
                'projects',
                <>
                  projects <DemoIcon kind="projects" />
                </>,
                {
                  title: 'Featured Projects',
                  badge: 'Showcase',
                  preview:
                    'From everyday utilities to high-scale infrastructure and experimental research.',
                },
              )}
              , from everyday utilities <DemoIcon kind="utilities" />, to
              infrastructure <DemoIcon kind="infrastructure" /> and{' '}
              <span className="no-wrap">
                research <DemoIcon kind="research" />.
              </span>
            </p>
          </BlurFade>

          <BlurFade delay={0.38} yOffset={12}>
            <p className="intro-sentence">
              Besides that, I love{' '}
              {word('passions', 'Minecraft', {
                title: 'Minecraft',
                badge: 'Sandbox',
                preview:
                  'Redstone computation, systems mechanics & large collaborative builds.',
              })}
              ,{' '}
              {word('passions', 'Photography', {
                title: 'Photography',
                badge: 'Visuals',
                preview:
                  'Framing light, candid moments, geometry & street perspectives.',
              })}{' '}
              and <span className="no-wrap">creative tinkering.</span>
            </p>
          </BlurFade>
          {showAfter('passions')}

          <BlurFade delay={0.46} yOffset={12}>
            <p className="intro-sentence">
              You can spot me on the internet via{' '}
              {word('contact', 'GitHub', {
                title: 'GitHub',
                badge: 'Open Source',
                preview: 'Repositories, open-source explorations & active coding projects.',
              })}
              ,{' '}
              {word('contact', 'LinkedIn', {
                title: 'LinkedIn',
                badge: 'Network',
                preview: 'Connect with me for internships, projects, and work history.',
              })}
              ,{' '}
              {word('contact', 'Reddit', {
                title: 'Reddit',
                badge: 'Community',
                preview: 'Tech discussions, hardware tinkering & community threads.',
              })}{' '}
              and{' '}
              {word('contact', <span className="no-wrap">Email!</span>, {
                title: 'Email',
                badge: 'Direct',
                preview: 'Drop me a line anytime: feedback, ideas, or opportunities.',
              })}
            </p>
          </BlurFade>
          {showAfter('contact')}

          <BlurFade delay={0.54} yOffset={12}>
            <p className="intro-sentence intro-signoff">See you around!</p>
          </BlurFade>
        </div>
      </header>

      <div className="longform-content">
        <div className="longform-container">
          <LongFormSection topicId="about" />
          <TrueNorthSection />
          <LongFormSection topicId="projects" />
          <LongFormSection topicId="passions" />
          <LongFormSection topicId="contact" />
        </div>
      </div>
    </main>
  )
}
