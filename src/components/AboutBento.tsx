export function WaterlooCrest({ className = 'waterloo-crest' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 120"
      className={className}
      aria-label="University of Waterloo Shield"
      role="img"
    >
      <path
        d="M10 10 H90 V65 C90 95 50 115 50 115 C50 115 10 95 10 65 Z"
        fill="#FFD100"
        stroke="#111111"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* Black Chevron */}
      <path
        d="M10 62 L50 25 L90 62 L90 76 L50 39 L10 76 Z"
        fill="#111111"
      />
      {/* Red Lions */}
      <g fill="#D52B1E">
        <path d="M26 18 C28 16 32 17 33 20 C34 23 31 26 28 26 C25 26 23 23 24 20 Z" />
        <path d="M22 26 C26 24 33 27 34 32 C35 37 30 40 27 40 C23 39 21 33 22 26 Z" />
        <path d="M68 18 C70 16 74 17 75 20 C76 23 73 26 70 26 C67 26 65 23 66 20 Z" />
        <path d="M64 26 C68 24 75 27 76 32 C77 37 72 40 69 40 C65 39 63 33 64 26 Z" />
        <path d="M46 72 C48 70 52 71 53 74 C54 77 51 80 48 80 C45 80 43 77 44 74 Z" />
        <path d="M43 80 C46 78 53 81 54 86 C55 91 50 94 47 94 C44 93 42 88 43 80 Z" />
      </g>
    </svg>
  )
}

export function ProfileCard({ standalone = false }: { standalone?: boolean }) {
  return (
    <article className={`bento-card bento-card-profile ${standalone ? 'is-standalone' : ''}`}>
      <div className="bento-profile-wrap">
        <div className="bento-photo-container">
          <img
            src="/peter-photo.jpg"
            alt="Peter Shao"
            className="bento-profile-img"
            loading="lazy"
          />
        </div>
        <div className="bento-profile-info">
          <h3 className="bento-card-title">Peter Shao</h3>
          <p className="bento-card-subtitle">Toronto, Canada | CE @ uWaterloo</p>
          <p className="bento-card-body">
            I love building soft/hardware projects that people find value in.
          </p>
          <div className="bento-freetime">
            <span className="bento-freetime-label">In my freetime, I am a:</span>
            <ul className="bento-freetime-list">
              <li>Homelab Nerd</li>
              <li>Audio/camera aficionado</li>
            </ul>
          </div>
        </div>
      </div>
    </article>
  )
}

export function LanguagesCard({ standalone = false }: { standalone?: boolean }) {
  return (
    <article className={`bento-card bento-card-languages ${standalone ? 'is-standalone' : ''}`}>
      <div className="bento-languages-content">
        <div>
          <h3 className="bento-card-title">I speak:</h3>
          <p className="bento-lang-primary">Chinese and English</p>
        </div>
        <div className="bento-streak-box">
          <p className="bento-lang-secondary">Learning Spanish with a 1k+ streak</p>
          <span className="bento-streak-badge">1,000+ day streak</span>
        </div>
      </div>
    </article>
  )
}

export function WaterlooCard({ standalone = false }: { standalone?: boolean }) {
  return (
    <article className={`bento-card bento-card-waterloo ${standalone ? 'is-standalone' : ''}`}>
      <div className="bento-waterloo-wrap">
        <div className="bento-crest-box">
          <WaterlooCrest />
        </div>
        <div className="bento-waterloo-info">
          <h3 className="bento-card-title">University of Waterloo</h3>
          <p className="bento-card-subtitle">
            Waterloo, Ontario | First Year Computer Engineering
          </p>
          <p className="bento-card-body">
            Awesome school with the largest co-op program in NA. I am learning & applying my skills
            in the workforce here.
          </p>
        </div>
      </div>
    </article>
  )
}

export function CompEngFocusCard({ standalone = false }: { standalone?: boolean }) {
  const focusAreas = [
    {
      title: 'Distributed systems',
      details: 'edge networking & IPS, stack design, data security',
    },
    {
      title: 'Machine learning',
      details: 'LLM Fine tuning, research reproduction & optimization, Applied ML',
    },
    {
      title: 'Electronics',
      details: 'embedded computing, imaging pipeline engineering, HW repairs',
    },
  ]

  return (
    <article className={`bento-card bento-card-compeng ${standalone ? 'is-standalone' : ''}`}>
      <h3 className="bento-card-title bento-compeng-heading">
        I learn CompEng with a focus on:
      </h3>
      <div className="bento-focus-list">
        {focusAreas.map((area) => (
          <div key={area.title} className="bento-focus-row">
            <span className="bento-focus-bullet">-</span>
            <div className="bento-focus-text">
              <span className="bento-focus-name">{area.title}</span>{' '}
              <span className="bento-focus-desc">({area.details})</span>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

export function AboutBentoGrid() {
  return (
    <div className="about-bento-grid" aria-label="About Me Grid">
      {/* Row 1: Profile + Languages */}
      <div className="about-bento-row-top">
        <ProfileCard />
        <LanguagesCard />
      </div>

      {/* Row 2: University of Waterloo */}
      <div className="about-bento-row-middle">
        <WaterlooCard />
      </div>

      {/* Row 3: CompEng Focus Areas */}
      <div className="about-bento-row-bottom">
        <CompEngFocusCard />
      </div>
    </div>
  )
}
