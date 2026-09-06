import { type MouseEvent, useState } from 'react'
import { BlurFade } from './BlurFade'

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
      className={`bento-card ${className} ${standalone ? 'is-standalone' : ''}`}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      <div className="bento-card-spotlight" aria-hidden="true" />
      <div className="bento-card-content">{children}</div>
    </article>
  )
}

function DefaultGithubAvatar() {
  return (
    <svg
      className="contact-avatar-fallback"
      viewBox="0 0 24 24"
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

function DefaultLinkedInAvatar() {
  return (
    <svg
      className="contact-avatar-fallback"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  )
}

function DefaultEmailAvatar() {
  return (
    <svg
      className="contact-avatar-fallback"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

interface AccountItemProps {
  username: string
  url: string
  avatarUrl: string
  fallbackAvatarUrl?: string
  brand?: 'github' | 'linkedin' | 'email'
}

function AccountItem({
  username,
  url,
  avatarUrl,
  fallbackAvatarUrl,
  brand = 'github',
}: AccountItemProps) {
  const [currentSrc, setCurrentSrc] = useState(avatarUrl)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (fallbackAvatarUrl && currentSrc !== fallbackAvatarUrl) {
      setCurrentSrc(fallbackAvatarUrl)
    } else {
      setHasError(true)
    }
  }

  return (
    <a
      href={url}
      target={url.startsWith('mailto:') ? undefined : '_blank'}
      rel={url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
      className="contact-account-link"
      aria-label={`${brand} profile: ${username}`}
    >
      <div className="contact-account-avatar">
        {!hasError ? (
          <img
            src={currentSrc}
            alt={username}
            className="contact-avatar-img"
            loading="lazy"
            onError={handleError}
          />
        ) : brand === 'linkedin' ? (
          <DefaultLinkedInAvatar />
        ) : brand === 'email' ? (
          <DefaultEmailAvatar />
        ) : (
          <DefaultGithubAvatar />
        )}
      </div>
      <span className="contact-account-name">{username}</span>
      <span className="contact-account-arrow" aria-hidden="true">↗</span>
    </a>
  )
}

export function GithubContactCard({ standalone = false }: { standalone?: boolean }) {
  const accounts: AccountItemProps[] = [
    {
      username: 'Peteryhs',
      url: 'https://github.com/Peteryhs',
      avatarUrl: 'https://github.com/Peteryhs.png',
    },
    {
      username: 'ShaoRou459',
      url: 'https://github.com/ShaoRou459',
      avatarUrl: 'https://github.com/ShaoRou459.png',
    },
  ]

  return (
    <BentoCardWrapper
      id={!standalone ? 'contact-github' : undefined}
      className="contact-card github-contact-card"
      standalone={standalone}
    >
      <div className="contact-card-inner">
        {/* Left: Github Brand Title */}
        <div className="contact-brand-wrap">
          <h3 className="contact-brand-title">Github</h3>
        </div>

        {/* Vertical Divider */}
        <div className="contact-card-divider" aria-hidden="true" />

        {/* Right: Account Links Row */}
        <div className="contact-accounts-row">
          {accounts.map((account) => (
            <AccountItem
              key={account.username}
              username={account.username}
              url={account.url}
              avatarUrl={account.avatarUrl}
              brand="github"
            />
          ))}
        </div>
      </div>
    </BentoCardWrapper>
  )
}

export function LinkedInContactCard({ standalone = false }: { standalone?: boolean }) {
  return (
    <BentoCardWrapper
      id={!standalone ? 'contact-linkedin' : undefined}
      className="contact-card linkedin-contact-card"
      standalone={standalone}
    >
      <div className="contact-card-inner">
        {/* Left: LinkedIn Brand Title */}
        <div className="contact-brand-wrap">
          <h3 className="contact-brand-title">LinkedIn</h3>
        </div>

        {/* Vertical Divider */}
        <div className="contact-card-divider" aria-hidden="true" />

        {/* Right: Account Links Row */}
        <div className="contact-accounts-row">
          <AccountItem
            username="Peter Shao"
            url="https://www.linkedin.com/in/peter-shao-ysh/"
            avatarUrl="https://github.com/Peteryhs.png"
            fallbackAvatarUrl="/peter-photo.jpg"
            brand="linkedin"
          />
        </div>
      </div>
    </BentoCardWrapper>
  )
}

export function EmailContactCard({ standalone = false }: { standalone?: boolean }) {
  return (
    <BentoCardWrapper
      id={!standalone ? 'contact-email' : undefined}
      className="contact-card email-contact-card"
      standalone={standalone}
    >
      <div className="contact-card-inner">
        {/* Left: Email Brand Title */}
        <div className="contact-brand-wrap">
          <h3 className="contact-brand-title">Email</h3>
        </div>

        {/* Vertical Divider */}
        <div className="contact-card-divider" aria-hidden="true" />

        {/* Right: Account Links Row */}
        <div className="contact-accounts-row">
          <AccountItem
            username="contact@mail.peteryhs.com"
            url="mailto:contact@mail.peteryhs.com"
            avatarUrl="https://github.com/Peteryhs.png"
            fallbackAvatarUrl="/peter-photo.jpg"
            brand="email"
          />
        </div>
      </div>
    </BentoCardWrapper>
  )
}

export function ContactExpandedView() {
  const handleScrollToContact = () => {
    const el = document.getElementById('contact-github') || document.getElementById('contact')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="contact-expanded-wrap" onClick={handleScrollToContact}>
      <div className="contact-cards-stack">
        <BlurFade delay={0.04} duration={0.42} yOffset={8}>
          <GithubContactCard standalone />
        </BlurFade>
        <BlurFade delay={0.08} duration={0.42} yOffset={8}>
          <LinkedInContactCard standalone />
        </BlurFade>
        <BlurFade delay={0.12} duration={0.42} yOffset={8}>
          <EmailContactCard standalone />
        </BlurFade>
      </div>
    </div>
  )
}

export function ContactSection() {
  return (
    <section className="longform-section contact-section" id="contact" aria-labelledby="contact-heading">
      <BlurFade delay={0.06} duration={0.5} yOffset={10}>
        <h2 id="contact-heading" className="longform-heading">
          Contact
        </h2>
      </BlurFade>

      <div className="contact-cards-stack">
        <BlurFade delay={0.12} duration={0.45} yOffset={10}>
          <GithubContactCard />
        </BlurFade>
        <BlurFade delay={0.18} duration={0.45} yOffset={10}>
          <LinkedInContactCard />
        </BlurFade>
        <BlurFade delay={0.24} duration={0.45} yOffset={10}>
          <EmailContactCard />
        </BlurFade>
      </div>
    </section>
  )
}
