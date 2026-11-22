import { DemoIcon } from '../DemoIcon'
import { BLOCKS, type BlockId, type BlockIcon } from './blocks'
import { Surface } from './surfaces'

function RestIcon({ icon }: { icon: BlockIcon }) {
  if (icon.type === 'photo') return <span className="tb-photo" />
  if (icon.type === 'crest') return <img className="tb-crest" src={`${import.meta.env.BASE_URL}waterloo-shield.svg`} alt="" />
  return <DemoIcon kind={icon.kind} />
}

export function Chevron() {
  return (
    <svg className="tb-chevron" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
    </svg>
  )
}

interface TopicBlockProps {
  id: BlockId
  expanded: boolean
  onSelect: (id: BlockId) => void
}

/** A keycap-style trigger that wakes an embedded surface while hovered, focused or expanded. */
export function TopicBlock({ id, expanded, onSelect }: TopicBlockProps) {
  const block = BLOCKS[id]
  return (
    <button
      type="button"
      className="tb topic-block"
      data-topic={id}
      data-frame={block.frame}
      data-magnetic
      aria-expanded={expanded}
      aria-controls={`topic-${id}`}
      aria-label={block.label}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
    >
      <Surface id={id} />
      <span className="tb-slot" aria-hidden="true">
        <span className="tb-rest">
          <RestIcon icon={block.icon} />
          <span className="tb-label">{block.label}</span>
          <Chevron />
        </span>
        <span className="tb-hover">{block.hoverLabel}</span>
      </span>
    </button>
  )
}
