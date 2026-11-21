import type { IconKind } from '../CategoryIcon'
import type { TopicId } from '../../content/site'

export type FrameKind =
  | 'default'
  | 'pixel'
  | 'pcb'
  | 'viewfinder'
  | 'projects'
  | 'waterloo'
  | 'studio'
  | 'systems'
  | 'ml'
  | 'watcloud'
  | 'hacktheridge'

export type BlockIcon =
  | { type: 'photo' }
  | { type: 'crest' }
  | { type: 'demo'; kind: IconKind }

export interface BlockConfig {
  id: TopicId
  /** Resting copy. Also the accessible name. */
  label: string
  /** Copy that rises into the block while it is lit. */
  hoverLabel: string
  icon: BlockIcon
  frame: FrameKind
}

export const BLOCKS = {
  about: { id: 'about', label: 'Peter', hoverLabel: 'Peter Shao', icon: { type: 'photo' }, frame: 'studio' },
  waterloo: { id: 'waterloo', label: 'University of Waterloo', hoverLabel: "ECE Co-op · '31", icon: { type: 'crest' }, frame: 'waterloo' },
  compeng: { id: 'compeng', label: 'CompEng', hoverLabel: 'Stream 8', icon: { type: 'demo', kind: 'engineering' }, frame: 'pcb' },
  watcloud: { id: 'watcloud', label: 'WATonomous', hoverLabel: 'Slurm & K8s', icon: { type: 'demo', kind: 'infrastructure' }, frame: 'watcloud' },
  hacktheridge: { id: 'hacktheridge', label: 'Hack the Ridge', hoverLabel: 'Web Dev & Brand', icon: { type: 'demo', kind: 'hackathon' }, frame: 'hacktheridge' },
  systems: { id: 'systems', label: 'distributed systems', hoverLabel: 'Linux & Docker', icon: { type: 'demo', kind: 'systems' }, frame: 'systems' },
  ml: { id: 'ml', label: 'machine learning', hoverLabel: 'PyTorch & Agents', icon: { type: 'demo', kind: 'machine-learning' }, frame: 'ml' },
  electronics: { id: 'electronics', label: 'electronics', hoverLabel: 'PCBs & MCU', icon: { type: 'demo', kind: 'electronics' }, frame: 'pcb' },
  projects: { id: 'projects', label: 'projects', hoverLabel: 'AI/Infra OSS', icon: { type: 'demo', kind: 'projects' }, frame: 'projects' },
  minecraft: { id: 'minecraft', label: 'Minecraft', hoverLabel: 'Hypixel', icon: { type: 'demo', kind: 'minecraft' }, frame: 'pixel' },
  photography: { id: 'photography', label: 'Photography', hoverLabel: 'Stick Cameras', icon: { type: 'demo', kind: 'photography' }, frame: 'viewfinder' },
} as const satisfies Record<string, BlockConfig>

export type BlockId = keyof typeof BLOCKS

export const EMAIL_ADDRESS = 'contact@mail.peteryhs.com'
export const GITHUB_URL = 'https://github.com/Peteryhs'
export const LINKEDIN_URL = 'https://www.linkedin.com/in/peter-shao-ysh/'
