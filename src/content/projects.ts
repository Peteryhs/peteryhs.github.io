export interface ProjectItem {
  slug: string
  name: string
  tagline: string
  stars: number
  starsNote?: string
  repo: string
  coAuthored?: string
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
      'Deployments': '1,000+',
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
    starsNote: 'co-owned repo, hosted under anaqvi02',
    repo: 'anaqvi02/we-have-pangram-at-home',
    coAuthored: 'Peter Shao, Ali Naqvi',
    description:
      'A custom AI-text detector built from only public data, extending the Pangram classifier approach as a first-ever language model training project with significantly less cost. Reaches 93.4% on a benchmark of 4,000 unseen essays and 89% on the RAID benchmark built from untrained generators, trained end to end on a single H100.',
    stats: {
      'ROC-AUC (Essays)': '93.4%',
      'ROC-AUC (RAID)': '89.0%',
      'In-Domain Validation': '99.88%',
      'Train Time (1x H100)': '90 min',
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
      'A hybrid homelab fleet, one home origin server and one public edge gateway, running 20+ self-hosted containers for family and friends across ~13TB of storage. The residential network exposes zero ports: traffic arrives through the edge gateway with TLS passthrough and CrowdSec threat blocking, the result of 4 years of iteration on its 5th stable build.',
    stats: {
      Storage: '13 TB',
      Containers: '20+',
      'Tailnet Nodes': '5',
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
    starsNote: 'upstream project, not mine',
    repo: 'NousResearch/hermes-agent',
    description:
      'A contributor to Hermes Agent, an open-source AI agent framework with 240,000+ GitHub stars. Shipped a security fix that stops secret environment variables from leaking in terminal output, with more PRs under review for desktop launcher reliability and dashboard design.',
    stats: {
      'PRs Submitted': '4',
      'Commits Upstream': '1',
      'Upstream Stars': '240k+',
    },
    links: {
      github: 'https://github.com/NousResearch/hermes-agent',
    },
  },
]
