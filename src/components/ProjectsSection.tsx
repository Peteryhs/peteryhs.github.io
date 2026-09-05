import { type MouseEvent, useState } from 'react'
import { BlurFade } from './BlurFade'
import { SunSystemsOrbit } from './SunSystemsOrbit'
import { SunSystemsLogo } from './SunSystemsLogo'
import { projectsData, type ProjectItem } from '../content/projects'

function GithubIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`project-svg-icon ${className}`}
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

function StarIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`project-svg-icon project-star-svg ${className}`}
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function ExternalArrowIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`project-svg-icon project-arrow-svg ${className}`}
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M17 7H8M17 7V16" />
    </svg>
  )
}

function MarketplaceIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`project-svg-icon ${className}`}
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(stars >= 100000 ? 0 : 1)}k`
  }
  return stars.toString()
}

function getMarketplaceLabel(url: string): string {
  if (url.includes('auto_tool_selecter')) return 'Auto Tool Selector'
  if (url.includes('exa_router')) return 'Exa Router Search'
  return 'Marketplace Tool'
}

export function ProjectCard({
  project,
  className = '',
  onHoverChange,
}: {
  project: ProjectItem
  className?: string
  onHoverChange?: (isHovered: boolean) => void
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
      className={`bento-card project-card ${
        project.slug === 'sun-systems' || project.slug === 'ai-detector' ? 'card-has-hover-logo' : ''
      } ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <div className="bento-card-spotlight" aria-hidden="true" />
      <div className="bento-card-content project-card-inner">
        {/* Header: Title, Tagline & Star Counter */}
        <div className="project-card-header">
          <div className="project-card-heading-group">
            <div className="project-card-title-wrap">
              <h3
                className={`project-card-title ${
                  project.slug === 'sun-systems' || project.slug === 'ai-detector' ? 'has-hover-logo' : ''
                }`}
              >
                <span className="project-title-text">{project.name}</span>
              </h3>
            </div>
            <p className="project-card-tagline">{project.tagline}</p>
            {project.slug === 'sun-systems' && (
              <span className="project-title-logo-swap" aria-hidden="true">
                <img
                  src="/assets/ss-lockup-white.svg"
                  alt="Sun Systems"
                  className="project-title-wordmark-img"
                  draggable={false}
                />
              </span>
            )}
            {project.slug === 'ai-detector' && (
              <span className="project-title-logo-swap" aria-hidden="true">
                <img
                  src="/assets/ai-detector-logo.png"
                  alt="AI Detector"
                  className="project-title-logo-img"
                  draggable={false}
                />
              </span>
            )}
          </div>

          {/* GitHub Stars (Muted GitHub style) */}
          <div className="project-card-star-count-wrap" title={`${project.stars.toLocaleString()} GitHub Stars`}>
            <StarIcon />
            <span className="project-star-count">{formatStars(project.stars)}</span>
          </div>
        </div>

        {/* Narrative Description */}
        <p className="project-card-description">{project.description}</p>

        {/* Stats Grid Metrics */}
        <div className="project-stats-grid">
          {Object.entries(project.stats).map(([label, value]) => (
            <div key={label} className="project-stat-pill">
              <span className="project-stat-value">{value}</span>
              <span className="project-stat-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Action Footer: Links, Repo, Marketplace */}
        <div className="project-card-footer">
          <a
            href={project.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="project-link-btn project-link-github"
            aria-label={`View ${project.name} on GitHub`}
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
              aria-label={`View on OpenWebUI marketplace: ${getMarketplaceLabel(url)}`}
            >
              <MarketplaceIcon />
              <span>{getMarketplaceLabel(url)}</span>
              <ExternalArrowIcon />
            </a>
          ))}
        </div>
      </div>
    </article>
  )
}

export function ProjectsGrid({ isExpanded = false }: { isExpanded?: boolean }) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)

  return (
    <>
      <SunSystemsOrbit isActive={hoveredSlug === 'sun-systems'} />

      <div className={`projects-grid ${isExpanded ? 'is-expanded-view' : ''}`}>
        {projectsData.map((project, idx) => (
          <BlurFade
            key={project.slug}
            delay={isExpanded ? 0.05 + idx * 0.06 : 0.08 + idx * 0.08}
            duration={0.45}
            yOffset={10}
            inViewMargin="-40px"
          >
            <ProjectCard
              project={project}
              onHoverChange={(isHovered) => {
                setHoveredSlug(isHovered ? project.slug : null)
              }}
            />
          </BlurFade>
        ))}
      </div>
    </>
  )
}

export function ProjectsSection() {
  return (
    <section className="longform-section projects-section" id="projects" aria-labelledby="projects-heading">
      <BlurFade delay={0.06} duration={0.5} yOffset={10}>
        <h2 id="projects-heading" className="longform-heading">
          Projects
        </h2>
      </BlurFade>

      <ProjectsGrid />
    </section>
  )
}

