/**
 * Long-form case study content, one entry per project slug.
 * Written from each repo's README; images were copied from the repos into
 * public/case/<slug>/ (converted to webp, transparent ones flattened).
 *
 * A section is a heading plus blocks. Text-like blocks sit in the right-hand
 * column; visual blocks (`wide`) span the full width under the heading.
 */

export interface Figure {
  src: string
  alt: string
  caption?: string
  width: number
  height: number
  /** Background the image was flattened onto, so the frame matches it. */
  tone?: 'light' | 'dark'
  /** Cap the display width for tall charts. */
  size?: 'narrow'
}

export type CaseBlock =
  | { kind: 'text'; paragraphs: string[] }
  /** "- Bold (muted)" list, the same voice as the About card. */
  | { kind: 'list'; items: { title: string; text: string }[] }
  | { kind: 'timeline'; items: { when: string; title: string; text?: string }[] }
  | {
      kind: 'hardware'
      items: { name: string; role: string; icon: 'laptop' | 'vps' | 'drive'; specs: string[] }[]
    }
  | {
      kind: 'services'
      hosts: Record<string, string>
      items: { name: string; text: string; host: string; inHouse?: boolean; href?: string }[]
    }
  | {
      kind: 'routes'
      items: { tag: string; title: string; nodes: { label: string; detail?: string }[]; links: string[]; note: string }[]
    }
  | { kind: 'steps'; loop?: string; items: { title: string; text: string; file?: string }[] }
  | { kind: 'split'; groups: { label: string; items: string[] }[] }
  | { kind: 'metrics'; items: { display: string; fraction: number; label: string; note?: string }[] }
  | { kind: 'router'; stages: { label: string; note?: string }[]; branches: { name: string; icon: 'code' | 'image' | 'search' }[] }
  | {
      kind: 'counters'
      total: { value: number; label: string }
      parts: { value: number; label: string; href?: string }[]
      releases: { value: number; label: string }
    }
  | { kind: 'figure'; figure: Figure }
  | { kind: 'figureTabs'; items: (Figure & { label: string })[] }
  | { kind: 'rows'; items: { tag: string; title: string; href: string; meta: string }[] }

export interface CaseSection {
  heading: string
  blocks: CaseBlock[]
}

export interface CaseStudy {
  /** Optional cover image shown between the header and the lede. */
  cover?: Figure
  /** A live, interactive cover drawn in place of an image. */
  hero?: { kind: 'hardNegatives'; caption: string }
  sections: CaseSection[]
}

export const WIDE_BLOCKS = new Set<CaseBlock['kind']>([
  'hardware',
  'routes',
  'steps',
  'metrics',
  'router',
  'figure',
  'figureTabs',
  'split',
  'rows',
  'counters',
])

export const caseStudies: Record<string, CaseStudy> = {
  'openwebui-agentic-tooling': {
    sections: [
      {
        heading: 'What it does',
        blocks: [
          {
            kind: 'text',
            paragraphs: [
              'The suite has two parts. The Auto Tool Selector is a master router: it reads each message and decides which tool should handle it, so nobody has to pick one by hand. Exa Agentic Search is an iterative research tool that sets its own search parameters and adapts its strategy to how hard the question is.',
            ],
          },
        ],
      },
      {
        heading: 'Routing',
        blocks: [
          {
            kind: 'router',
            stages: [
              { label: 'User request', note: 'plus the previous 3 turns' },
              { label: 'Image analysis' },
              { label: 'Helper model decides' },
            ],
            branches: [
              { name: 'Code interpreter', icon: 'code' },
              { name: 'Image generation', icon: 'image' },
              { name: 'Exa search router', icon: 'search' },
            ],
          },
        ],
      },
      {
        heading: 'Adoption',
        blocks: [
          {
            kind: 'text',
            paragraphs: ['Both parts are published on the OpenWebUI marketplace.'],
          },
          {
            kind: 'counters',
            total: { value: 1064, label: 'Combined downloads' },
            parts: [
              { value: 767, label: 'Auto Tool Selector', href: 'https://openwebui.com/posts/auto_tool_selecter_add9aede' },
              { value: 297, label: 'Exa Router Search', href: 'https://openwebui.com/t/sdjfhsud/exa_router_search' },
            ],
            releases: { value: 6, label: 'Releases' },
          },
        ],
      },
    ],
  },

  'ai-detector': {
    hero: {
      kind: 'hardNegatives',
      caption:
        'Hard negatives: human texts that read like AI, each threaded to the AI-written mirror found for it. Training on these pairs is what sharpens the detector. Illustrative layout.',
    },
    sections: [
      {
        heading: 'Data',
        blocks: [
          {
            kind: 'text',
            paragraphs: [
              'The detector follows the Pangram technical report, rebuilt from public data only. Filters drop code and templated documents, keep 200 to 5,000-word texts with real paragraph structure, and apply stricter rules to chat-sourced data. A four-phase balancing pipeline measures how much of each source survives filtering and sets download quotas so the final set stays balanced.',
            ],
          },
          {
            kind: 'split',
            groups: [
              { label: 'Human writing', items: ['FineWeb-Edu', 'IvyPanda', 'PERSUADE'] },
              { label: 'AI writing', items: ['Cosmopedia', 'LMSYS', 'Kaggle AI Essays'] },
            ],
          },
        ],
      },
      {
        heading: 'Pipeline',
        blocks: [
          {
            kind: 'steps',
            items: [
              { title: 'Get data', text: 'Fetch and filter the open sources into human and AI corpora.', file: 'download_data_v5.py' },
              { title: 'Build an index', text: 'Embed the AI corpus with MiniLM-L6-v2 into a usearch index.', file: 'build_index.py' },
              { title: 'Train', text: 'DeBERTa-v3-large in a curriculum loop with hard-negative mining.', file: 'train.py' },
              { title: 'Evaluate', text: 'FPR at 95% recall, held-out essays, and the RAID benchmark.', file: 'evaluate.py' },
            ],
          },
          {
            kind: 'figure',
            figure: {
              src: '/case/ai-detector/pipeline.webp',
              alt: 'Training pipeline diagram',
              caption: 'The training pipeline, from the repo.',
              width: 1100,
              height: 661,
              tone: 'light',
            },
          },
        ],
      },
      {
        heading: 'Training loop',
        blocks: [
          {
            kind: 'text',
            paragraphs: [
              'Each round, the model scans held-out human essays and picks the ones it most wants to call AI. Each of those hard negatives is paired with its nearest AI neighbour from the index instead of generating a fresh AI mirror, which keeps the cost down. The best model trained for 3 epochs, roughly 90 minutes on a single H100.',
            ],
          },
          {
            kind: 'steps',
            loop: 'Repeat · ~100k new pairs per round',
            items: [
              { title: 'Train', text: 'Fit DeBERTa-v3-large on the current set.' },
              { title: 'Validate', text: 'Score the validation split.' },
              { title: 'Mine', text: 'Find the human essays it mistakes for AI.' },
              { title: 'Pair', text: 'Retrieve their nearest AI mirrors and add the pairs.' },
            ],
          },
          {
            kind: 'figure',
            figure: {
              src: '/case/ai-detector/training-curve.webp',
              alt: 'Curriculum training curves: loss, validation accuracy, dataset size and mined samples by epoch',
              caption: 'Loss falls while the dataset grows with every mining round.',
              width: 1400,
              height: 1225,
              tone: 'dark',
              size: 'narrow',
            },
          },
        ],
      },
      {
        heading: 'Results',
        blocks: [
          {
            kind: 'metrics',
            items: [
              { display: '99.88%', fraction: 0.9988, label: 'In-domain validation' },
              { display: '0.934', fraction: 0.934, label: 'ROC-AUC, 4,000 unseen essays' },
              { display: '0.89', fraction: 0.89, label: 'ROC-AUC, RAID essays', note: 'generators it never saw' },
              { display: '0.81', fraction: 0.81, label: 'ROC-AUC, RAID attacked', note: 'adversarial text' },
            ],
          },
          {
            kind: 'figureTabs',
            items: [
              { label: 'Essays', src: '/case/ai-detector/essay-results.webp', alt: 'Model performance metrics on the essay benchmark', width: 1200, height: 825, tone: 'light' },
              { label: 'Confusion', src: '/case/ai-detector/essay-confusion.webp', alt: 'Essay benchmark confusion matrix', width: 1000, height: 867, tone: 'light' },
              { label: 'RAID', src: '/case/ai-detector/raid-results.webp', alt: 'RAID results, clean versus with attacks', width: 1350, height: 825, tone: 'light' },
              { label: 'vs Pangram', src: '/case/ai-detector/pangram-vs-ours.webp', alt: 'Recall and false positive rate, Pangram versus ours', width: 1633, height: 891, tone: 'light' },
            ],
          },
        ],
      },
    ],
  },

  'sun-systems': {
    sections: [
      {
        heading: 'Architecture',
        blocks: [
          {
            kind: 'text',
            paragraphs: [
              'Two machines share the work. Casa runs the compute-heavy services at home, next to the main storage drive. A Racknerd VPS runs the lighter ones and doubles as Casa\'s public gateway. Everything runs in Docker and is managed through Cockpit.',
            ],
          },
          {
            kind: 'hardware',
            items: [
              { name: 'Casa', role: 'Home origin', icon: 'laptop', specs: ['Repaired HP ENVY', 'i5 10th gen', '8 GB RAM', 'Zorin OS 17'] },
              { name: 'Racknerd', role: 'Cloud edge', icon: 'vps', specs: ['2-core AMD', '2.5 GB RAM', '40 GB SSD', 'Ubuntu'] },
              { name: 'Ultrastar', role: 'Main storage', icon: 'drive', specs: ['12 TB Seagate', 'USB-A bridge', 'Immich + Nextcloud data'] },
            ],
          },
        ],
      },
      {
        heading: 'What it hosts',
        blocks: [
          {
            kind: 'services',
            hosts: { casa: 'Casa', vps: 'VPS' },
            items: [
              { name: 'Nextcloud', text: 'files, notes and office editing', host: 'casa' },
              { name: 'Immich', text: 'photo library with ML search', host: 'casa' },
              { name: 'Vaultwarden', text: 'password manager', host: 'casa' },
              { name: 'Memos', text: 'notes', host: 'casa' },
              { name: 'Obsidian LiveSync', text: 'note sync across devices', host: 'casa' },
              { name: 'Open WebUI', text: 'self-hosted AI chat', host: 'vps' },
              { name: 'New API', text: 'LLM API routing and usage', host: 'vps' },
              { name: 'Uptime Kuma', text: 'uptime monitoring', host: 'vps' },
              { name: 'Vigyl', text: 'LCD status display beside Casa', host: 'casa', inHouse: true, href: 'https://github.com/Peteryhs/Vigyl' },
              { name: 'Memos MCP', text: 'gives AI agents access to Memos', host: 'vps', inHouse: true, href: 'https://github.com/ShaoRou459/memos-mcp' },
              { name: 'CockpitAgent', text: 'AI agent for server management', host: 'vps', inHouse: true, href: 'https://github.com/ShaoRou459/CockpitAgent' },
            ],
          },
        ],
      },
      {
        heading: 'Three ways in',
        blocks: [
          {
            kind: 'text',
            paragraphs: [
              'Cloudflare Tunnels are the easy path, but they cap transfers at 100 MB, which rules out Nextcloud and Immich. Those go through a custom Layer 4 blind proxy on the VPS instead, with TLS passed straight through to Casa, so even the VPS provider can\'t read the traffic.',
            ],
          },
          {
            kind: 'routes',
            items: [
              {
                tag: 'A',
                title: 'Blind proxy',
                nodes: [{ label: 'Public web' }, { label: 'VPS', detail: 'Layer 4 blind proxy' }, { label: 'Caddy on Casa', detail: 'TLS ends here' }, { label: 'Immich · Nextcloud' }],
                links: ['request', 'TLS passthrough', ''],
                note: 'Data-heavy services. Only Casa can read the traffic.',
              },
              {
                tag: 'B',
                title: 'Tunnel to Casa',
                nodes: [{ label: 'Public web' }, { label: 'Cloudflare edge' }, { label: 'Casa', detail: 'Memos · Obsidian LiveSync' }],
                links: ['request', 'tunnel'],
                note: 'Light, text-heavy services straight from the origin.',
              },
              {
                tag: 'C',
                title: 'Tunnel to VPS',
                nodes: [{ label: 'Public web' }, { label: 'Cloudflare edge' }, { label: 'VPS', detail: 'Open WebUI · New API' }],
                links: ['request', 'tunnel'],
                note: 'The lightweight services hosted on the edge.',
              },
            ],
          },
          {
            kind: 'figure',
            figure: {
              src: '/case/sun-systems/network-topology.webp',
              alt: 'Sun Systems network topology',
              caption: 'Network topology. Orange is Cloudflare tunnels, purple is CrowdSec, red is blocked threats, grey is the Tailscale overlay.',
              width: 1800,
              height: 977,
              tone: 'light',
            },
          },
        ],
      },
      {
        heading: 'Security',
        blocks: [
          {
            kind: 'text',
            paragraphs: [
              'CrowdSec guards the blind proxy path, so the services holding the most precious data stay safe without Cloudflare in front. Cloudflare Access adds an email check in front of the Vaultwarden admin panel.',
            ],
          },
          {
            kind: 'steps',
            items: [
              { title: 'Caddy on Casa', text: 'Writes the access logs.' },
              { title: 'CrowdSec agent', text: 'Reads the logs and flags attackers.' },
              { title: 'CrowdSec LAPI', text: 'Shares decisions over Tailscale.' },
              { title: 'Bouncer on VPS', text: 'Drops bad IPs in nftables.' },
            ],
          },
        ],
      },
      {
        heading: 'Four years of builds',
        blocks: [
          {
            kind: 'timeline',
            items: [
              { when: '2022', title: 'A lone computer by the desk' },
              { when: '2024', title: 'Edge and a fresh start', text: 'Added the VPS, rebuilt Casa on Zorin OS 17, moved to fibre.' },
              { when: '2025', title: 'Storage expansion', text: 'Added the 12 TB Ultrastar.' },
              { when: '2026', title: 'Blind proxy gateway', text: 'Plus a Watchtower and Cockpit refresh.' },
              { when: 'Next', title: 'RAID-Z', text: 'Replacing the Borg backups with real redundancy.' },
            ],
          },
        ],
      },
    ],
  },

  'hermes-contributions': {
    sections: [
      {
        heading: 'Focus',
        blocks: [
          {
            kind: 'text',
            paragraphs: [
              'Hermes Agent is Nous Research\'s open-source agent framework. My pull requests stick to three areas: keeping secrets safe, making the desktop app reliable, and polishing the interface.',
            ],
          },
        ],
      },
      {
        heading: 'Pull requests',
        blocks: [
          {
            kind: 'rows',
            items: [
              { tag: 'Security', title: 'Redact known Hermes secret env vars regardless of code_file mode', href: 'https://github.com/NousResearch/hermes-agent/pull/61352', meta: '#61352' },
              { tag: 'Reliability', title: 'Pin the venv interpreter in the generated launcher entry', href: 'https://github.com/NousResearch/hermes-agent/pull/83358', meta: '#83358' },
              { tag: 'Reliability', title: 'Don\'t resolve the venv interpreter in the launcher entry', href: 'https://github.com/NousResearch/hermes-agent/pull/94311', meta: '#94311' },
              { tag: 'UI/UX', title: 'Align the dashboard /login page with the Hermes landing page', href: 'https://github.com/NousResearch/hermes-agent/pull/96580', meta: '#96580' },
            ],
          },
        ],
      },
    ],
  },
}
