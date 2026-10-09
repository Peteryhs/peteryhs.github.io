import { useEffect, useRef } from 'react'
import { projectsData, type ProjectItem } from '../content/projects'
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

export function CaseStudyPage({ slug }: { slug: string }) {
  const index = projectsData.findIndex((p) => p.slug === slug)
  const project = projectsData[index]
  const next = projectsData[(index + 1) % projectsData.length]
  const headingRef = useRef<HTMLHeadingElement>(null)

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

      <div className="case-body">
        <p className="case-lede case-reveal" style={{ ['--i' as string]: 0 }}>
          {project.description}
        </p>

        {project.caseStudy.map((section, i) => (
          <section key={section.heading} className="case-section case-reveal" style={{ ['--i' as string]: i + 1 }}>
            <h2 className="case-section-heading">{section.heading}</h2>
            <div className="case-section-content">
              {section.body?.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="case-paragraph">
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <dl className="case-points">
                  {section.bullets.map((point) => (
                    <div key={point.title ?? point.text} className="case-point">
                      {point.title && <dt>{point.title}</dt>}
                      <dd>{point.text}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </section>
        ))}

        {project.notes && (
          <aside
            className="case-note case-reveal"
            style={{ ['--i' as string]: project.caseStudy.length + 1 }}
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
