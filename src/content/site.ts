export type TopicId =
  | 'about'
  | 'waterloo'
  | 'compeng'
  | 'projects'
  | 'passions'
  | 'contact'

export type Topic = {
  id: TopicId
  eyebrow: string
  title: string
  shortTitle: string
  preview: string
  description: string
  accent: string
  items?: { title: string; text: string; tag?: string }[]
}

export const topics: Topic[] = [
  {
    id: 'about',
    eyebrow: '01 / about me',
    title: 'About Me',
    shortTitle: 'Peter Shao',
    preview: 'Toronto, Canada · CE @ uWaterloo · Building soft & hardware projects.',
    description: 'A snapshot of who I am, what I build, and what I speak.',
    accent: '✦',
    items: [
      { title: 'Location', text: 'Toronto, Canada' },
      { title: 'Program', text: 'Computer Engineering @ University of Waterloo' },
      { title: 'Freetime', text: 'Homelab Nerd & Audio/camera aficionado' },
    ],
  },
  {
    id: 'waterloo',
    eyebrow: '02 / education',
    title: 'University of Waterloo',
    shortTitle: 'uWaterloo',
    preview: 'First Year Computer Engineering with NA’s largest co-op ecosystem.',
    description: 'Waterloo, Ontario · First Year Computer Engineering.',
    accent: '🏛',
    items: [
      { title: 'Faculty', text: 'Faculty of Engineering (ECE)' },
      { title: 'Co-op Program', text: 'Largest co-op program in North America' },
      { title: 'Current Focus', text: 'Applying technical fundamentals in the workforce' },
    ],
  },
  {
    id: 'compeng',
    eyebrow: '03 / focus areas',
    title: 'Computer Engineering Focus',
    shortTitle: 'CompEng Focus',
    preview: 'Distributed systems, practical ML & hardware/electronics engineering.',
    description: 'Core domains where I spend my time building and researching.',
    accent: '⚙',
    items: [
      {
        title: 'Distributed Systems',
        text: 'Edge networking & IPS, stack design, data security',
        tag: 'Systems',
      },
      {
        title: 'Machine Learning',
        text: 'LLM fine-tuning, research reproduction & optimization, applied ML',
        tag: 'AI / ML',
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
    eyebrow: '04 / projects',
    title: 'Projects',
    shortTitle: 'projects',
    preview: 'A growing collection of experiments and useful software & hardware builds.',
    description: 'From everyday friction utilities to low-latency infrastructure and research.',
    accent: '✳',
    items: [
      { title: 'Systems Playground', text: 'Distributed consensus & edge networking experiments.', tag: 'Systems' },
      { title: 'Useful Little Tools', text: 'Small utilities built for everyday friction.', tag: 'Tools' },
      { title: 'Practical ML Lab', text: 'Hands-on inference acceleration & model tuning.', tag: 'AI' },
    ],
  },
  {
    id: 'passions',
    eyebrow: '05 / other passions',
    title: 'Other Passions',
    shortTitle: 'passions',
    preview: 'Photography, Minecraft mechanics, and the pleasure of looking closely.',
    description: 'Creative sandbox worlds and visual arts that keep technical work playful.',
    accent: '☼',
    items: [
      { title: 'Photography', text: 'Street, geometry, framing light, and candid architecture.' },
      { title: 'Minecraft', text: 'Redstone computation, systems mechanics & shared worlds.' },
    ],
  },
  {
    id: 'contact',
    eyebrow: '06 / contact',
    title: 'Contact',
    shortTitle: 'say hello',
    preview: 'GitHub, LinkedIn, Reddit, or email — drop a note anytime!',
    description: 'Let’s connect for collaborations, internships, or interesting rabbit holes.',
    accent: '♡',
    items: [
      { title: 'GitHub', text: 'github.com/peter — code, tools & active builds.', tag: 'code' },
      { title: 'LinkedIn', text: 'Connect professionally and see past chapters.', tag: 'connect' },
      { title: 'Email', text: 'Drop a line with an idea, question, or opportunity.', tag: 'direct' },
    ],
  },
]

export const topicById = Object.fromEntries(
  topics.map((topic) => [topic.id, topic]),
) as Record<TopicId, Topic>
