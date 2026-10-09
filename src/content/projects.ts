export interface ProjectItem {
  slug: string
  name: string
  tagline: string
  repo: string
  description: string
  stats: Record<string, string | number>
  notes?: string
  links: {
    github: string
    marketplace?: string[]
  }
  /** Long-form write-up shown on the project's case study page. */
  caseStudy: CaseStudySection[]
}

export interface CaseStudySection {
  heading: string
  /** Paragraphs, in order. */
  body?: string[]
  /** Optional list shown after the paragraphs. */
  bullets?: { title?: string; text: string }[]
}

export const projectsData: ProjectItem[] = [
  {
    slug: 'openwebui-agentic-tooling',
    name: 'OpenWebUI Agentic Tooling Suite',
    tagline: 'Autonomous tool routing for the self-hosted AI platform',
    repo: 'ShaoRou459/OpenWebUI-Agentic-Tooling',
    description:
      'A plugin suite that turns OpenWebUI from a chat interface into an autonomous agent. It auto-routes queries to dedicated tools like image generation, vision, code execution, and a custom-built deep research agent. 1,000+ combined community deployments to servers across two marketplace listings.',
    stats: {
      'Combined Downloads': '1,064+',
      'Auto Tool Selector': '767 dl',
      'Exa Router': '297 dl',
      Releases: '6',
    },
    caseStudy: [
      {
        heading: 'What it does',
        body: [
          'The suite has two parts. The Auto Tool Selector is a master router: it reads each message and decides which tool should handle it, so nobody has to pick one by hand. Exa Agentic Search is an iterative research tool that sets its own search parameters and adapts its strategy to how hard the question is.',
        ],
      },
      {
        heading: 'Capabilities',
        bullets: [
          { title: 'Autonomous routing', text: 'Queries go to the right tool with no manual switching.' },
          { title: 'Agentic search', text: 'Multi-step research that adjusts its depth to the query.' },
          { title: 'Image generation & editing', text: 'Prompts are optimized automatically, and attached images switch it to image-to-image editing.' },
          { title: 'Code execution', text: 'Runs code in Jupyter or a lightweight Python interpreter.' },
          { title: 'Vision for any model', text: 'Non-vision models get image understanding through automatic transcription.' },
          { title: 'Live status & debugging', text: 'Progress updates during each tool run, plus session summaries and metrics in the logs.' },
        ],
      },
      {
        heading: 'Adoption',
        body: [
          'Both parts are published on the OpenWebUI marketplace, where they have passed 1,064 combined downloads (767 for the Auto Tool Selector, 297 for the Exa Router) across 6 releases.',
        ],
      },
    ],
    links: {
      github: 'https://github.com/ShaoRou459/OpenWebUI-Agentic-Tooling',
      marketplace: [
        'https://openwebui.com/posts/auto_tool_selecter_add9aede',
        'https://openwebui.com/t/sdjfhsud/exa_router_search',
      ],
    },
  },
  {
    slug: 'ai-detector',
    name: 'AI Detector, Probably',
    tagline: 'Custom AI-text detector, reproduced and extended from published research',
    repo: 'anaqvi02/we-have-pangram-at-home',
    description:
      'A custom AI-text detector built from only public data, extending the Pangram classifier approach as a first-ever language model training project with significantly less cost. Reaches 93.4% on a benchmark of 4,000 unseen essays and 89% on the RAID benchmark built from untrained generators, trained end to end on a single H100.',
    stats: {
      'Unseen Essays': '93.4%',
      'RAID Benchmark': '89.0%',
      'In-Domain Validation': '99.88%',
    },
    notes:
      'Adversarial attacks cost ~8 ROC-AUC points and roughly double false positives (12% to 27% at 80% recall), expected without adversarial training.',
    caseStudy: [
      {
        heading: 'Approach',
        body: [
          'The detector follows the Pangram technical report, rebuilt from public data only. Human writing comes from FineWeb-Edu, IvyPanda and PERSUADE; AI writing from Cosmopedia, LMSYS and the Kaggle AI Essays set.',
          'Filters drop code and templated documents, keep 200 to 5,000-word texts with real paragraph structure, and apply stricter rules to chat-sourced data. A four-phase balancing pipeline measures how much of each source survives filtering and sets download quotas so the final set stays balanced.',
        ],
      },
      {
        heading: 'Training loop',
        body: [
          'DeBERTa-v3-large trains in a curriculum loop. After each round, the model scans held-out human essays and picks the ones it most wants to call AI. Each of those hard negatives is paired with its nearest AI neighbour from a MiniLM embedding index, instead of generating a fresh AI mirror, which keeps the cost down.',
        ],
        bullets: [
          { title: 'Hard negatives', text: 'About 100k new pairs added per round.' },
          { title: 'Compute', text: 'Best model: 3 epochs, roughly 90 minutes on a single H100.' },
        ],
      },
      {
        heading: 'Results',
        body: [
          'In-domain validation reached 99.88%. On 4,000 essays from sources it never saw, ROC-AUC is 0.934, and on the clean RAID essay split, built from generators it never trained on, it holds 0.89.',
        ],
      },
    ],
    links: {
      github: 'https://github.com/anaqvi02/we-have-pangram-at-home',
    },
  },
  {
    slug: 'sun-systems',
    name: 'Sun Systems',
    tagline: 'Hybrid homelab fleet, home origin + cloud edge',
    repo: 'Peteryhs/Server',
    description:
      'A hybrid homelab fleet featuring one origin server and one edge VPS. Running 20+ self-hosted containers across 13TB of storage for family and friends. Custom-built edge network using Cloudflare, a blind proxy, and CrowdSec to ensure data safety.',
    stats: {
      Storage: '13 TB',
      Containers: '20+',
      Evolution: '4 Yrs · Build v5',
    },
    caseStudy: [
      {
        heading: 'Architecture',
        body: [
          'Two machines share the work. Casa, a repaired HP ENVY laptop at home, runs the compute-heavy services next to a 12 TB drive. A Racknerd VPS runs the lighter ones and doubles as Casa\'s public gateway. Everything runs in Docker and is managed through Cockpit.',
        ],
      },
      {
        heading: 'What it hosts',
        bullets: [
          { title: 'Nextcloud', text: 'Files, notes and office editing in place of Google Workspace.' },
          { title: 'Immich', text: 'Photo and video library with ML-powered search.' },
          { title: 'Vaultwarden', text: 'Password manager that works with the Bitwarden apps.' },
          { title: 'Memos & Obsidian LiveSync', text: 'Notes, synced across devices.' },
          { title: 'Open WebUI & New API', text: 'Self-hosted AI chat with routed model APIs.' },
          { title: 'Built in-house', text: 'Vigyl (an LCD status display beside Casa), a Memos MCP server, and CockpitAgent.' },
        ],
      },
      {
        heading: 'Network & security',
        body: [
          'Light, text-heavy services go out through Cloudflare Tunnels. Nextcloud and Immich move files far past Cloudflare\'s 100 MB cap, so they take a custom Layer 4 blind proxy on the VPS, which forwards to Caddy on Casa over Tailscale. TLS passes straight through, so even the VPS provider can\'t read the traffic.',
          'A CrowdSec agent on Casa watches Caddy\'s logs, and a bouncer on the VPS drops flagged IPs in nftables before they reach the proxy. Cloudflare Access guards the Vaultwarden admin panel.',
        ],
      },
      {
        heading: 'Four years of builds',
        bullets: [
          { title: '2022', text: 'A lone computer by the desk.' },
          { title: '2024', text: 'Added the VPS, rebuilt Casa on Zorin OS 17, moved to fibre.' },
          { title: '2025', text: 'Added the 12 TB storage expansion.' },
          { title: '2026', text: 'Blind proxy gateway, and a Watchtower + Cockpit refresh.' },
        ],
      },
    ],
    links: {
      github: 'https://github.com/Peteryhs/Server',
    },
  },
  {
    slug: 'hermes-contributions',
    name: 'Contributions to Hermes Agent',
    tagline: 'Security and UX work on the open-source AI agent framework',
    repo: 'NousResearch/hermes-agent',
    description:
      'A contributor to Hermes Agent, one of the most popular open-source AI agent frameworks. My PRs focus on data security, reliability, and UI/UX design. Upstream code I shipped stops secrets from leaking through terminal output.',
    stats: {
      'Pull Requests Upstream': '4',
    },
    caseStudy: [
      {
        heading: 'Focus',
        body: [
          'Hermes Agent is Nous Research\'s open-source agent framework. My pull requests stick to three areas: keeping secrets safe, making the desktop app reliable, and polishing the interface.',
        ],
        bullets: [
          { title: 'Security', text: 'Redacting Hermes secret environment variables so they never leak through terminal output.' },
          { title: 'Reliability', text: 'Fixing which Python interpreter the desktop launcher entry resolves.' },
          { title: 'UI/UX', text: 'Restyling the dashboard login page to match the Hermes landing page.' },
        ],
      },
    ],
    links: {
      github: 'https://github.com/NousResearch/hermes-agent',
    },
  },
]
