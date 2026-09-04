export type TopicId =
  | 'about'
  | 'truenorth'
  | 'electronics'
  | 'systems'
  | 'ml'
  | 'waterloo'
  | 'compeng'
  | 'projects'
  | 'passions'
  | 'contact'

export type Topic = {
  id: TopicId
  title: string
  shortTitle: string
  preview: string
  description: string
  items?: { title: string; text: string; tag?: string }[]
}

export const topics: Topic[] = [
  {
    id: 'about',
    title: 'About Me',
    shortTitle: 'About',
    preview: 'Toronto, Canada · CE @ uWaterloo · Building soft & hardware projects.',
    description: 'A snapshot of who I am, what I build, and what I speak.',
    items: [
      { title: 'Location', text: 'Toronto, Canada' },
      { title: 'Program', text: 'Computer Engineering @ University of Waterloo' },
      { title: 'Freetime', text: 'Homelab Nerd & Audio/camera aficionado' },
    ],
  },
  {
    id: 'truenorth',
    title: 'True North',
    shortTitle: 'True North',
    preview: 'Six years of engineering · 2018 Electronics, 2022 Systems, 2023 ML.',
    description: "After six years of engineering, I found a few topics I'm truly passionate about.",
    items: [
      {
        title: 'Electronics',
        text: 'Customizing hardware & software to my needs, most recently a custom-programmed camera.',
        tag: '2018',
      },
      {
        title: 'Distributed systems',
        text: 'Self-hosting grown into complex systems reaching users across the internet.',
        tag: '2022',
      },
      {
        title: 'Machine learning',
        text: 'Fine-tuning & training from published research at a fraction of the cost.',
        tag: '2023',
      },
    ],
  },
  {
    id: 'electronics',
    title: 'Electronics & Hardware',
    shortTitle: 'Electronics',
    preview: 'Customizing hardware & software, from broken laptops to custom-programmed cameras.',
    description: 'Hardware customizations, embedded firmware, and camera engineering.',
  },
  {
    id: 'systems',
    title: 'Distributed Systems',
    shortTitle: 'Systems',
    preview: 'Self-hosting grown into complex systems reaching users across the internet.',
    description: 'Edge networking, Linux servers, clustering, and data security.',
  },
  {
    id: 'ml',
    title: 'Machine Learning',
    shortTitle: 'ML',
    preview: 'Reproducing research, fine-tuning models & cost-effective AI detectors.',
    description: 'Applied machine learning, generative models, and inference acceleration.',
  },
  {
    id: 'waterloo',
    title: 'University of Waterloo',
    shortTitle: 'Waterloo',
    preview: 'First Year Computer Engineering with NA’s largest co-op ecosystem.',
    description: 'Waterloo, Ontario · First Year Computer Engineering.',
    items: [
      { title: 'Faculty', text: 'Faculty of Engineering (ECE)' },
      { title: 'Co-op Program', text: 'Largest co-op program in North America' },
      { title: 'Current Focus', text: 'Applying technical fundamentals in the workforce' },
    ],
  },
  {
    id: 'compeng',
    title: 'Computer Engineering',
    shortTitle: 'CompEng',
    preview: 'Distributed systems, practical ML & hardware/electronics engineering.',
    description: 'Core domains where I spend my time building and researching.',
    items: [
      {
        title: 'Distributed Systems',
        text: 'Edge networking & IPS, stack design, data security',
        tag: 'Systems',
      },
      {
        title: 'Machine Learning',
        text: 'LLM fine-tuning, research reproduction & optimization, applied ML',
        tag: 'ML',
      },
      {
        title: 'Electronics & Hardware',
        text: 'Embedded computing, imaging pipeline engineering, HW repairs',
        tag: 'Hardware',
      },
    ],
  },
  {
    id: 'projects',
    title: 'Projects',
    shortTitle: 'Projects',
    preview: 'A collection of experiments, infrastructure builds, and everyday tools.',
    description: 'From everyday friction utilities to low-latency infrastructure and research.',
    items: [
      { title: 'Systems Playground', text: 'Distributed consensus & edge networking experiments.', tag: 'Systems' },
      { title: 'Useful Little Tools', text: 'Small utilities built for everyday friction.', tag: 'Tools' },
      { title: 'Practical ML Lab', text: 'Hands-on inference acceleration & model tuning.', tag: 'ML' },
    ],
  },
  {
    id: 'passions',
    title: 'Other Passions',
    shortTitle: 'Passions',
    preview: 'Photography, Minecraft mechanics, and the pleasure of looking closely.',
    description: 'Creative sandbox worlds and visual arts that keep technical work playful.',
    items: [
      { title: 'Photography', text: 'Street, geometry, framing light, and candid architecture.' },
      { title: 'Minecraft', text: 'Redstone computation, systems mechanics & shared worlds.' },
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    shortTitle: 'Contact',
    preview: 'GitHub, LinkedIn, Reddit, or email — drop a note anytime.',
    description: 'Let’s connect for collaborations, internships, or interesting ideas.',
    items: [
      { title: 'GitHub', text: 'github.com/peter — code, tools & active builds.', tag: 'Code' },
      { title: 'LinkedIn', text: 'Connect professionally and see past chapters.', tag: 'Network' },
      { title: 'Email', text: 'Drop a line with an idea, question, or opportunity.', tag: 'Direct' },
    ],
  },
]

export const topicById = Object.fromEntries(
  topics.map((topic) => [topic.id, topic]),
) as Record<TopicId, Topic>
