import { HardNegativeField } from './HardNegativeField'
import { useEffect, useRef } from 'react'
import { projectsData, type ProjectItem } from '../content/projects'
import { caseStudies, WIDE_BLOCKS, type CaseBlock } from '../content/caseStudies'
import { CaseBlockView, FigureView } from './CaseBlocks'
import { goHome, openProject, projectHref } from '../hooks/useRoute'
import { useGitHubStars } from '../hooks/useGitHubStars'
import {
  CaseArrowIcon,
  ExternalArrowIcon,
  GithubIcon,
  MarketplaceIcon,
  StarIcon,
  formatStars,
  getMarketplaceLabel,
} from './ProjectsSection'

// Whatever index.html ships as the title, so leaving a case study restores it.
const SITE_TITLE = typeof document === 'undefined' ? 'Peter Shao' : document.title
const CASE_TITLE_SUFFIX = 'Peter Shao'

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  )
}

function Stars({ project }: { project: ProjectItem }) {
  const stars = useGitHubStars(project.repo)
  if (stars.count === null) return null
  return (
    <a
      className="case-stars"
      href={`${project.links.github}/stargazers`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${stars.count.toLocaleString()} GitHub stars`}
    >
      <StarIcon />
      <span>{formatStars(stars.count)}</span>
    </a>
  )
}

/**
 * The back pill is rendered at app level, next to the theme toggle and the ⌘K
 * trigger. The rubber-band bounce moves the page by transforming its wrapper,
 * and a fixed element inside a transformed element is dragged along with it.
 */
export function CaseBack() {
  return (
    <a
      href="#"
      className="case-back"
      onClick={(e) => {
        e.preventDefault()
        goHome()
      }}
    >
      <BackIcon />
      <span>All projects</span>
    </a>
  )
}

export function CaseStudyPage({ slug }: { slug: string }) {
  const index = projectsData.findIndex((p) => p.slug === slug)
  const project = projectsData[index]
  const next = projectsData[(index + 1) % projectsData.length]
  const study = caseStudies[project.slug] ?? { sections: [] }
  const headingRef = useRef<HTMLHeadingElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Reveal sections as they scroll in; their components animate off the
  // same is-visible class (rails draw, meters fill, packets start moving).
  useEffect(() => {
    const root = bodyRef.current
    if (!root) return
    const targets = root.querySelectorAll<HTMLElement>('.case-reveal')
    if (!('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('is-visible'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [project.slug])

  useEffect(() => {
    document.title = `${project.name} · ${CASE_TITLE_SUFFIX}`
    headingRef.current?.focus({ preventScroll: true })
    return () => {
      document.title = SITE_TITLE
    }
  }, [project.name])

  // Escape goes back, unless something else (the palette) is handling it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      if ((e.target as HTMLElement | null)?.closest('input, textarea, [role="dialog"]')) return
      goHome()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <article className="case-page" aria-labelledby="case-title">
      <header className="case-hero">
        <div className="case-hero-inner">
          <div className="case-eyebrow">
            <span>
              Project {String(index + 1).padStart(2, '0')}
              <span className="case-eyebrow-total"> / {String(projectsData.length).padStart(2, '0')}</span>
            </span>
            <Stars project={project} />
          </div>

          <h1 id="case-title" className="case-title" ref={headingRef} tabIndex={-1}>
            <span className="case-title-text">{project.name}</span>
          </h1>
          <p className="case-tagline">{project.tagline}</p>

          <div className="project-stats-grid case-stats">
            {Object.entries(project.stats).map(([label, value]) => (
              <div key={label} className="project-stat-pill">
                <span className="project-stat-value">{value}</span>
                <span className="project-stat-label">{label}</span>
              </div>
            ))}
          </div>

          <div className="case-actions">
            <a
              href={project.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="project-link-btn project-link-github"
            >
              <GithubIcon />
              <span className="project-repo-name">{project.repo}</span>
              <ExternalArrowIcon />
            </a>
            {project.links.marketplace?.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="project-link-btn project-link-marketplace"
              >
                <MarketplaceIcon />
                <span>{getMarketplaceLabel(url)}</span>
                <ExternalArrowIcon />
              </a>
            ))}
          </div>
        </div>
      </header>

      <div className="case-body" ref={bodyRef}>
        {study.hero?.kind === 'hardNegatives' && (
          <div className="case-cover case-reveal" style={{ ['--i' as string]: 0 }}>
            <HardNegativeField caption={study.hero.caption} />
          </div>
        )}
        {!study.hero && study.cover && (
          <div className="case-cover case-reveal" style={{ ['--i' as string]: 0 }}>
            <FigureView figure={study.cover} />
          </div>
        )}
        <p className="case-lede case-reveal" style={{ ['--i' as string]: 0 }}>
          {project.description}
        </p>

        {study.sections.map((section, i) => {
          // Consecutive text-like blocks share the right-hand column; visual
          // blocks break out to the full width.
          const groups: { wide: boolean; blocks: CaseBlock[] }[] = []
          section.blocks.forEach((block) => {
            const wide = WIDE_BLOCKS.has(block.kind)
            const last = groups[groups.length - 1]
            if (last && !last.wide && !wide) last.blocks.push(block)
            else groups.push({ wide, blocks: [block] })
          })
          return (
            <section key={section.heading} className="case-section case-reveal" style={{ ['--i' as string]: i + 1 }}>
              <h2 className="case-section-heading">{section.heading}</h2>
              {groups.map((group, gi) => (
                <div
                  key={gi}
                  className={group.wide ? 'case-section-wide' : 'case-section-content'}
                >
                  {group.blocks.map((block, bi) => (
                    <CaseBlockView key={bi} block={block} />
                  ))}
                </div>
              ))}
            </section>
          )
        })}

        {project.notes && (
          <aside
            className="case-note case-reveal"
            style={{ ['--i' as string]: study.sections.length + 1 }}
          >
            <span className="case-note-label">Caveat</span>
            <p>{project.notes}</p>
          </aside>
        )}
      </div>

      <nav className="case-next" aria-label="Next project">
        <a
          href={projectHref(next.slug)}
          className="case-next-link"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
            e.preventDefault()
            openProject(next.slug)
          }}
        >
          <span className="case-next-label">Next project</span>
          <span className="case-next-name">{next.name}</span>
          <span className="case-next-tagline">{next.tagline}</span>
          <CaseArrowIcon className="case-next-arrow" />
        </a>
      </nav>
    </article>
  )
}
