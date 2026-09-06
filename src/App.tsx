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
import { AnimatedThemeToggler } from './components/AnimatedThemeToggler'
import { DemoIcon } from './components/DemoIcon'
import { InteractiveGridPattern } from './components/InteractiveGridPattern'
import { ProjectsSection, ProjectsGrid } from './components/ProjectsSection'
import { CompactProjectsGrid } from './components/CompactProjectsGrid'
import { PassionsSection, PhotographyExpandedView, MinecraftExpandedView } from './components/PassionsSection'
import {
  ContactSection,
  ContactExpandedView,
  GithubContactCard,
  LinkedInContactCard,
  EmailContactCard,
} from './components/ContactSection'
import { TrueNorthSection, TrueNorthTimeline } from './components/TrueNorth'
import { BottomBounceEffect } from './components/BottomBounceEffect'
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
    text: customInfo?.text || customInfo?.preview || topic.preview,
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
      case 'projects':
        return (
          <div className="expanded-cards-single">
            <CompactProjectsGrid />
          </div>
        )
      case 'passions':
      case 'photography':
        return (
          <div className="expanded-cards-single">
            <PhotographyExpandedView />
          </div>
        )
      case 'minecraft':
        return (
          <div className="expanded-cards-single">
            <MinecraftExpandedView />
          </div>
        )
      case 'github':
        return (
          <div className="expanded-cards-single">
            <GithubContactCard standalone />
          </div>
        )
      case 'linkedin':
        return (
          <div className="expanded-cards-single">
            <LinkedInContactCard standalone />
          </div>
        )
      case 'email':
        return (
          <div className="expanded-cards-single">
            <EmailContactCard standalone />
          </div>
        )
      case 'contact':
        return (
          <div className="expanded-cards-single">
            <ContactExpandedView />
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
      className={`expanded-section expanded-section-${topic.id}`}
      aria-label={topic.title}
      initial={{ opacity: 0, height: 0, filter: 'blur(10px)', y: -6 }}
      animate={{
        opacity: 1,
        height: 'auto',
        filter: 'blur(0px)',
        y: 0,
        transition: {
          height: { duration: 0.42, ease },
          opacity: { duration: 0.35, ease },
          filter: { duration: 0.35, ease },
          y: { duration: 0.35, ease },
        },
      }}
      exit={{
        opacity: 0,
        height: 0,
        filter: 'blur(10px)',
        y: -6,
        transition: {
          height: { duration: 0.38, ease },
          opacity: { duration: 0.28, ease },
          filter: { duration: 0.28, ease },
          y: { duration: 0.28, ease },
        },
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="expanded-section-content">
        {renderContent()}
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

  if (topicId === 'projects') {
    return <ProjectsSection />
  }

  if (topicId === 'passions') {
    return <PassionsSection />
  }

  if (topicId === 'contact') {
    return <ContactSection />
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

  const handleSelect = (id: TopicId) => {
    setActiveId((prev) => (prev === id ? null : id))
  }

  const handleHover = (info: CursorInfo | null, e?: React.MouseEvent) => {
    setCursorInfo(info)
    if (e && info) {
      cursorRef.current?.syncPosition(e.clientX, e.clientY)
    }
  }

  const word = (
    id: TopicId,
    children: ReactNode,
    customInfo?: { text?: string; preview?: string; title?: string; badge?: string },
  ) => {
    return (
      <TopicWord
        id={id}
        activeId={activeId}
        onSelect={handleSelect}
        onHover={handleHover}
        customInfo={customInfo}
      >
        {children}
      </TopicWord>
    )
  }

  const showAfter = (...ids: TopicId[]) => {
    const isMatching = Boolean(activeId && ids.includes(activeId))
    return (
      <AnimatePresence mode="wait">
        {isMatching && activeId && (
          <ExpandedSection key={activeId} topic={topicById[activeId]} />
        )}
      </AnimatePresence>
    )
  }

  return (
    <>
      <AnimatedThemeToggler />
      <CursorFollower ref={cursorRef} activeInfo={cursorInfo} />

      <BottomBounceEffect>
        <main>
          <header className="intro" id="top">
        <div className="intro-container">
          <BlurFade delay={0.06} yOffset={12}>
            <p className="intro-sentence">
              Hi <span className="intro-wave-hand" role="img" aria-label="waving hand">👋</span>, I am{' '}
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
                  text: 'Peter Shao / PeterYHS, Toronto based tech nerd',
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
                  University of Waterloo{' '}
                  <img
                    src="/waterloo-crest.png"
                    alt=""
                    className="intro-waterloo-icon"
                    aria-hidden="true"
                  />
                </>,
                {
                  text: 'University famous for its co-op program in Waterloo, ON',
                },
              )}{' '}
              studying{' '}
              {word(
                'compeng',
                <>
                  CompEng <DemoIcon kind="engineering" />
                </>,
                {
                  text: "First year computer engineering, class of '31",
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
                  text: 'Homelab clusters, edge networking, and high-availability systems',
                },
              )}
              ,{' '}
              {word(
                'ml',
                <>
                  ML <DemoIcon kind="machine-learning" />
                </>,
                {
                  text: 'Fine-tuning open weights, model optimization, & fast inference',
                },
              )}{' '}
              and{' '}
              {word(
                'electronics',
                <span className="no-wrap">
                  electronics <DemoIcon kind="electronics" />.
                </span>,
                {
                  text: 'Embedded firmware, microcontrollers, and custom hardware',
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
                  text: 'Everyday utilities, low-latency infrastructure, and ML prototypes',
                },
              )}
              , from everyday utilities <DemoIcon kind="utilities" />, to
              infrastructure <DemoIcon kind="infrastructure" /> and{' '}
              <span className="no-wrap">
                research <DemoIcon kind="research" />.
              </span>
            </p>
          </BlurFade>
          {showAfter('projects')}

          <BlurFade delay={0.38} yOffset={12}>
            <p className="intro-sentence">
              Besides that, I love{' '}
              {word('minecraft', 'Minecraft', {
                text: '1.8 PvP Bedwars, modern SMPs, modpacks, & Sun Systems friend servers',
              })}
              ,{' '}
              {word('photography', 'Photography', {
                text: 'Spontaneous walks, outing recaps, year-in-reviews, & camera gear',
              })}
              {' '}and <span className="no-wrap">creative tinkering.</span>
            </p>
          </BlurFade>
          {showAfter('minecraft', 'photography', 'passions')}

          <BlurFade delay={0.46} yOffset={12}>
            <p className="intro-sentence">
              You can spot me on the internet via{' '}
              {word('github', 'GitHub', {
                text: 'Open-source repositories, active experiments, and hobby code',
              })}
              ,{' '}
              {word('linkedin', 'LinkedIn', {
                text: 'Professional background, hackathons, and engineering co-op',
              })}
              {' '}and{' '}
              {word('email', <span className="no-wrap">Email!</span>, {
                text: 'Always open to chat about engineering ideas & opportunities',
              })}
            </p>
          </BlurFade>
          {showAfter('contact', 'github', 'linkedin', 'email')}

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

          <footer className="site-footer">
            <div className="site-footer-inner">
              <p className="site-footer-text">
                © {new Date().getFullYear()} Peter Shao. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </main>
  </BottomBounceEffect>
</>
)
}
