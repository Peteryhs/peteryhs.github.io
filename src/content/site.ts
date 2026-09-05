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
    preview: 'Peter Shao / PeterYHS, Toronto based tech nerd',
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
        text: 'Technology does incredible things, but it is also flawed. I want to understand it, and improve it for myself and others.',
        tag: '2018',
      },
      {
        title: 'Distributed systems',
        text: 'A simple Linux server on my laptop grew into a stack that hosts everything I use. I want to build systems that serve the people around me, not just myself.',
        tag: '2022',
      },
      {
        title: 'Machine learning',
        text: "Google's magic erase sparked my interest in AI, LLMs got me into the research papers, not just the models. I want to understand them, and improve their methodology and practicality.",
        tag: '2023',
      },
    ],
  },
  {
    id: 'electronics',
    title: 'Electronics & Hardware',
    shortTitle: 'Electronics',
    preview: 'Embedded firmware, microcontrollers, and custom hardware',
    description: 'Hardware customizations, embedded firmware, and camera engineering.',
  },
  {
    id: 'systems',
    title: 'Distributed Systems',
    shortTitle: 'Systems',
    preview: 'Homelab clusters, edge networking, and high-availability systems',
    description: 'Edge networking, Linux servers, clustering, and data security.',
  },
  {
    id: 'ml',
    title: 'Machine Learning',
    shortTitle: 'ML',
    preview: 'Fine-tuning open weights, model optimization, & fast inference',
    description: 'Applied machine learning, generative models, and inference acceleration.',
  },
  {
    id: 'waterloo',
    title: 'University of Waterloo',
    shortTitle: 'Waterloo',
    preview: 'University famous for its co-op program in Waterloo, ON',
    description: 'Waterloo, Ontario · First Year Computer Engineering.',
    items: [
      { title: 'Faculty', text: 'Faculty of Engineering (ECE)' },
      { title: 'Co-op Program', text: '5 co-op terms across tech, infrastructure, and applied engineering' },
      { title: 'Current Focus', text: 'Applying technical fundamentals in the workforce' },
    ],
  },
  {
    id: 'compeng',
    title: 'Computer Engineering',
    shortTitle: 'CompEng',
    preview: "First year computer engineering, class of '31",
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
    preview: 'A collection of everyday utilities, low-latency infrastructure experiments, and ML prototypes.',
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
