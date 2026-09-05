export interface ProjectItem {
  slug: string
  name: string
  tagline: string
  stars: number
  repo: string
  description: string
  stats: Record<string, string | number>
  notes?: string
  links: {
    github: string
    marketplace?: string[]
  }
}

export const projectsData: ProjectItem[] = [
  {
    slug: 'openwebui-agentic-tooling',
    name: 'OpenWebUI Agentic Tooling Suite',
    tagline: 'Autonomous tool routing for the self-hosted AI platform',
    stars: 28,
    repo: 'ShaoRou459/OpenWebUI-Agentic-Tooling',
    description:
      'A plugin suite that turns OpenWebUI from a chat interface into an autonomous agent. It auto-routes queries to dedicated tools like image generation, vision, code execution, and a custom-built deep research agent. 1,000+ combined community deployments to servers across two marketplace listings.',
    stats: {
      'Combined Downloads': '1,064+',
      'Auto Tool Selector': '767 dl',
      'Exa Router': '297 dl',
      Releases: '6',
    },
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
    stars: 5,
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
    links: {
      github: 'https://github.com/anaqvi02/we-have-pangram-at-home',
    },
  },
  {
    slug: 'sun-systems',
    name: 'Sun Systems',
    tagline: 'Hybrid homelab fleet, home origin + cloud edge',
    stars: 15,
    repo: 'Peteryhs/Server',
    description:
      'A hybrid homelab fleet featuring one origin server and one edge VPS. Running 20+ self-hosted containers across 13TB of storage for family and friends. Custom-built edge network using Cloudflare, a blind proxy, and CrowdSec to ensure data safety.',
    stats: {
      Storage: '13 TB',
      Containers: '20+',
      Evolution: '4 Yrs · Build v5',
    },
    links: {
      github: 'https://github.com/Peteryhs/Server',
    },
  },
  {
    slug: 'hermes-contributions',
    name: 'Contributions to Hermes Agent',
    tagline: 'Security and UX work on a 240k-star AI agent framework',
    stars: 240822,
    repo: 'NousResearch/hermes-agent',
    description:
      'A contributor to Hermes Agent, one of the most popular open-source AI agent frameworks. My PRs focus on data security, reliability, and UI/UX design. Upstream code I shipped stops secrets from leaking through terminal output.',
    stats: {
      'Pull Requests Upstream': '4',
    },
    links: {
      github: 'https://github.com/NousResearch/hermes-agent',
    },
  },
]
