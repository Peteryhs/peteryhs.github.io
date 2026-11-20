import { AnimatePresence, motion } from 'motion/react'
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  AboutBentoGrid,
  ProfileCard,
  LanguagesCard,
  WaterlooCard,
  CompEngFocusCard,
} from './components/AboutBento'
import { BlurFade } from './components/BlurFade'
import { MagneticCursor } from './components/MagneticCursor'
import { TopicBlock } from './components/hero/TopicBlock'
import { ExternalLink, EmailLink } from './components/hero/SocialLink'
import { AnimatedThemeToggler } from './components/AnimatedThemeToggler'
import { WebringBadge } from './components/WebringBadge'
import { IconLabel } from './components/DemoIcon'
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
import { CommandPalette, CommandPaletteTrigger } from './components/CommandPalette'
import { CaseStudyPage, CaseBack } from './components/CaseStudyPage'
import { useRoute } from './hooks/useRoute'
import { topicById, type Topic, type TopicId } from './content/site'
import type { BlockId } from './components/hero/blocks'

const ease = [0.16, 1, 0.3, 1] as const

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
      id={`topic-${topic.id}`}
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
  const route = useRoute()
  const [activeId, setActiveId] = useState<TopicId | null>(null)

  // Click anywhere outside expanded cards to animate them out
  useEffect(() => {
    if (!activeId) return

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest('.expanded-section') || target.closest('.topic-block')) {
        return
      }
      setActiveId(null)
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
    }
  }, [activeId])

  // From the command palette: bring the intro into view and expand the topic.
  const openTopic = useCallback((id: TopicId) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    setActiveId(id)
  }, [])

  const handleSelect = (id: TopicId) => {
    setActiveId((prev) => (prev === id ? null : id))
  }

  const block = (id: BlockId) => <TopicBlock id={id} expanded={activeId === id} onSelect={handleSelect} />

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
      {route.name === 'project' && <CaseBack />}
      <AnimatedThemeToggler />
      <CommandPaletteTrigger />
      <CommandPalette onOpenTopic={openTopic} />
      <MagneticCursor />

      <BottomBounceEffect>
        {route.name === 'project' && (
          <main className="case-main">
            <CaseStudyPage key={route.slug} slug={route.slug} />
          </main>
        )}
        {/* The home page stays mounted (just hidden) behind a case study, so
            coming back doesn't replay every entrance animation and the card
            is there to morph into. */}
        <main hidden={route.name === 'project'}>
          <header className="intro" id="top">
        <div className="intro-container">
          <div className="intro-group">
            <BlurFade delay={0.06} yOffset={12}>
              <p className="intro-sentence">
                Hi <span className="intro-wave-hand" role="img" aria-label="waving hand">👋</span>, I am{' '}
                <span className="no-wrap">{block('about')}.</span>
              </p>
            </BlurFade>
            {showAfter('about')}
          </div>

          <div className="intro-group">
            <BlurFade delay={0.14} yOffset={12}>
              <p className="intro-sentence">
                A student at the {block('waterloo')} studying{' '}
                <span className="no-wrap">{block('compeng')}.</span>
              </p>
            </BlurFade>
            {showAfter('waterloo', 'compeng')}
          </div>

          <div className="intro-group">
            <BlurFade delay={0.22} yOffset={12}>
              <p className="intro-sentence">
                I am passionate about <span className="no-wrap">{block('systems')},</span> {block('ml')} and{' '}
                <span className="no-wrap">{block('electronics')}.</span>
              </p>
            </BlurFade>
            {showAfter('systems', 'ml', 'electronics', 'truenorth')}
          </div>

          <div className="intro-group">
            <BlurFade delay={0.3} yOffset={12}>
              <p className="intro-sentence">
                I love making <span className="no-wrap">{block('projects')},</span> from everyday <IconLabel kind="utilities">utilities</IconLabel>, to{' '}
                <IconLabel kind="infrastructure">infrastructure</IconLabel> and{' '}
                <span className="no-wrap">
                  <IconLabel kind="research">research</IconLabel>.
                </span>
              </p>
            </BlurFade>
            {showAfter('projects')}
          </div>

          <div className="intro-group">
            <BlurFade delay={0.38} yOffset={12}>
              <p className="intro-sentence">
                Besides that, I love <span className="no-wrap">{block('minecraft')},</span> {block('photography')} and{' '}
                <span className="no-wrap">creative tinkering.</span>
              </p>
            </BlurFade>
            {showAfter('minecraft', 'photography', 'passions')}
          </div>

          <div className="intro-group">
            <BlurFade delay={0.46} yOffset={12}>
              <p className="intro-sentence">
                You can spot me on the internet via <span className="no-wrap"><ExternalLink kind="github" />,</span> <ExternalLink kind="linkedin" /> and{' '}
                <EmailLink />
              </p>
            </BlurFade>
            {showAfter('contact', 'github', 'linkedin', 'email')}
          </div>

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
              <WebringBadge />
            </div>
          </footer>
        </div>
      </div>
    </main>
  </BottomBounceEffect>
</>
)
}
