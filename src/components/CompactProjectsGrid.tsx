import { projectsData } from '../content/projects'
import { motion } from 'motion/react'

export function CompactProjectsGrid() {
  const handleScrollToProject = (slug: string) => {
    const el = document.getElementById(`project-${slug}`) || document.getElementById('projects')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`)
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`)
  }

  return (
    <div className="compact-projects-grid">
      {projectsData.map((project, idx) => (
        <motion.article
          key={project.slug}
          className="bento-card compact-project-card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => handleScrollToProject(project.slug)}
          onMouseMove={handleMouseMove}
          role="button"
          tabIndex={0}
          aria-label={`View ${project.name}: ${project.tagline}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleScrollToProject(project.slug)
            }
          }}
        >
          <div className="bento-card-spotlight" aria-hidden="true" />
          <div className="bento-card-content compact-project-content">
            <div className="compact-project-header">
              <h4 className="compact-project-title">{project.name}</h4>
              <span className="compact-project-arrow" aria-hidden="true">↗</span>
            </div>
            <p className="compact-project-tagline">{project.tagline}</p>
          </div>
        </motion.article>
      ))}
    </div>
  )
}
