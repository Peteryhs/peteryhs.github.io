/** Font-independent greeting with the same warm ink-and-paper feel as the icons. */
export function WavingHand() {
  return (
    <svg className="intro-wave-hand" viewBox="0 0 48 48" role="img" aria-label="waving hand">
      <g fill="none" stroke="#65503b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m10 12-3-2M16 7l-1-4M6 19H2" stroke="#cc9650" />
        <path
          d="m16 28-5-9a3 3 0 0 1 5-3l5 8-7-15a3 3 0 0 1 5-2l7 15-5-16a3 3 0 0 1 6-1l5 16-2-12a3 3 0 0 1 6-1l3 19 2-5a3 3 0 0 1 6 2l-4 12c-2 7-8 11-15 9-6-1-9-5-12-10l-4-6a3 3 0 0 1 4-4Z"
          fill="#f5c65c"
          transform="translate(-1 0)"
        />
        <path d="M29 29c-4 1-6 5-5 9" />
        <path d="m16 31 4 6c2 3 4 4 7 5" stroke="#fff2c8" strokeWidth="2.5" />
      </g>
    </svg>
  )
}
