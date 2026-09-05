import { type MouseEvent } from 'react'
import { BlurFade } from './BlurFade'
import { CameraGearDock, MicrophoneCoiledWire } from './CameraGearDock'
import { FolderBadges } from './FolderBadges'
import { MinecraftMountain } from './MinecraftMountain'

export function scrollToSection(id: string) {
  const el = document.getElementById(id) || document.getElementById('passions')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

interface BentoCardProps {
  children: React.ReactNode
  className?: string
  standalone?: boolean
  id?: string
  onClick?: (e: MouseEvent<HTMLElement>) => void
}

function BentoCardWrapper({
  children,
  className = '',
  standalone = false,
  id,
  onClick,
}: BentoCardProps) {
  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`)
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`)
  }

  return (
    <article
      id={id}
      className={`bento-card ${className} ${standalone ? 'is-standalone is-clickable' : ''}`}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(e as any)
              }
            }
          : undefined
      }
    >
      <div className="bento-card-spotlight" aria-hidden="true" />
      <div className="bento-card-content">{children}</div>
    </article>
  )
}

export function PhotographyCard({
  standalone = false,
  onClick,
}: {
  standalone?: boolean
  onClick?: (e: MouseEvent<HTMLElement>) => void
}) {
  return (
    <BentoCardWrapper
      id={!standalone ? 'hobbies-photography' : undefined}
      className="passions-card hobbies-photo-card"
      standalone={standalone}
      onClick={onClick}
    >
      <h3 className="bento-card-title hobbies-card-title">Photography &amp; Video Production</h3>
      <div className="hobbies-card-paragraphs">
        <p className="passions-body-text hobbies-text-block">
          When I go places, such as trips, or even just a random walk I have taking photos and capturing those moments.
        </p>
        <p className="passions-body-text hobbies-text-block">
          Over the years I have gained the habit of making an recap video of major outings we go to, and a year video covering everything happened in a year.
        </p>
      </div>
    </BentoCardWrapper>
  )
}

export function MinecraftCard({
  standalone = false,
  onClick,
}: {
  standalone?: boolean
  onClick?: (e: MouseEvent<HTMLElement>) => void
}) {
  return (
    <BentoCardWrapper
      id={!standalone ? 'hobbies-minecraft' : undefined}
      className="passions-card hobbies-minecraft-card"
      standalone={standalone}
      onClick={onClick}
    >
      <h3 className="bento-card-title hobbies-card-title">Minecraft</h3>
      <div className="hobbies-card-paragraphs">
        <p className="passions-body-text hobbies-text-block">
          I am a BIG fan of Minecraft. My play style range from 1.8 PvP (Bedwars main here) to 26.x SMPs.
        </p>
        <p className="passions-body-text hobbies-text-block">
          I also play quite a lot of modded, with my faviorutes in Promience II and Deceasedcraftr. I also have some epxirences with hosting servers for my friends!
        </p>
      </div>
      <div className="hobbies-ign-badge-wrapper">
        <span className="hobbies-ign-badge" title="Minecraft In-Game Name">
          IGN: Peterfat11
        </span>
      </div>
    </BentoCardWrapper>
  )
}

export function PhotographyExpandedView() {
  const handleScroll = () => scrollToSection('hobbies-photography')

  return (
    <div className="hobbies-main-card-wrap hobbies-cards-stack is-expanded-view">
      <BlurFade delay={0.04} duration={0.42} yOffset={8}>
        <PhotographyCard standalone onClick={handleScroll} />
      </BlurFade>

      <BlurFade delay={0.08} duration={0.42} yOffset={8}>
        <CameraGearDock standalone onClick={handleScroll} />
      </BlurFade>
    </div>
  )
}

export function MinecraftExpandedView() {
  const handleScroll = () => scrollToSection('hobbies-minecraft')

  return (
    <div className="hobbies-main-card-wrap">
      <BlurFade delay={0.04} duration={0.42} yOffset={8}>
        <MinecraftCard standalone onClick={handleScroll} />
      </BlurFade>
    </div>
  )
}

export function HobbiesLayout({ isExpanded = false }: { isExpanded?: boolean }) {
  return (
    <div className={`hobbies-mockup-frame ${isExpanded ? 'is-expanded-view' : ''}`}>
      <div className="hobbies-mountain-wrapper" id="hobbies-mountain" aria-hidden="true">
        <BlurFade delay={isExpanded ? 0.18 : 0.22} duration={0.45} yOffset={10}>
          <MinecraftMountain />
        </BlurFade>
      </div>

      <div className="hobbies-grid-layout">
        {/* Left Column: Photography, Gear Dock, and Minecraft Cards */}
        <div className="hobbies-left-column">
          {/* 1. Photography & Video Card + Connected Gear Card */}
          <div className="hobbies-connected-gear-group">
            <BlurFade delay={isExpanded ? 0.05 : 0.08} duration={0.45} yOffset={10}>
              <PhotographyCard standalone={isExpanded} />
            </BlurFade>

            {/* Downward Spring Coiled Wire Connector */}
            <MicrophoneCoiledWire />

            <BlurFade delay={isExpanded ? 0.09 : 0.13} duration={0.45} yOffset={10}>
              <CameraGearDock standalone={isExpanded} />
            </BlurFade>
          </div>

          {/* 2. Minecraft Card */}
          <BlurFade delay={isExpanded ? 0.14 : 0.18} duration={0.45} yOffset={10}>
            <MinecraftCard standalone={isExpanded} />
          </BlurFade>
        </div>

        {/* Right Column: Aceternity-style Folder Badges */}
        <div className="hobbies-right-column">
          {/* 1. Folder Badges Hub (Photos, Minecraft Launcher, GEFA 2024 with Draggable Cards) */}
          <BlurFade delay={isExpanded ? 0.12 : 0.16} duration={0.45} yOffset={10}>
            <div className="hobbies-folders-area" id="hobbies-folders">
              <FolderBadges />
            </div>
          </BlurFade>
        </div>
      </div>
    </div>
  )
}

export function PassionsSection({ isExpanded = false }: { isExpanded?: boolean }) {
  if (isExpanded) {
    return <PhotographyExpandedView />
  }

  return (
    <section className="longform-section passions-section hobbies-section-container" id="passions" aria-labelledby="passions-heading">
      <BlurFade delay={0.06} duration={0.5} yOffset={10}>
        <h2 id="passions-heading" className="longform-heading hobbies-section-heading">
          Hobbies
        </h2>
      </BlurFade>
      <HobbiesLayout />
    </section>
  )
}

// Backward compatibility alias
export { PassionsSection as PassionsBentoGrid }
