export type TopicId = 'about' | 'projects' | 'experience' | 'passions' | 'contact'

export type Topic = {
  id: TopicId
  eyebrow: string
  title: string
  shortTitle: string
  preview: string
  description: string
  accent: string
  items: { title: string; text: string; tag?: string }[]
}

export const topics: Topic[] = [
  {
    id: 'about',
    eyebrow: '01 / about me',
    title: 'About me',
    shortTitle: 'Peter',
    preview: 'Computer Engineering at Waterloo, with an interest in how systems fit together.',
    description: 'A few quick facts, ready to become their own tiles.',
    accent: '✦',
    items: [
      { title: 'Studying', text: 'Computer Engineering' },
      { title: 'Based at', text: 'University of Waterloo' },
      { title: 'Interested in', text: 'Distributed systems, ML, and electronics' },
    ],
  },
  {
    id: 'projects',
    eyebrow: '02 / projects',
    title: 'Projects',
    shortTitle: 'projects',
    preview: 'A growing collection of experiments and useful things.',
    description: 'Draft project entries, ready to be replaced by the real thing.',
    accent: '✳',
    items: [
      { title: 'Systems playground', text: 'Distributed-systems experiments.', tag: 'draft' },
      { title: 'Useful little tools', text: 'Small utilities for everyday friction.', tag: 'draft' },
      { title: 'ML, but practical', text: 'Hands-on machine-learning explorations.', tag: 'draft' },
    ],
  },
  {
    id: 'experience',
    eyebrow: '03 / experience',
    title: 'Experience',
    shortTitle: 'my current chapter',
    preview: 'Computer Engineering at Waterloo, and room for what comes next.',
    description: 'A timeline of the chapters that shape how I build.',
    accent: '↗',
    items: [
      { title: 'University of Waterloo', text: 'Computer Engineering', tag: 'present' },
      { title: 'Next chapter', text: 'Internship, collaboration, research, or a useful detour.', tag: 'coming soon' },
    ],
  },
  {
    id: 'passions',
    eyebrow: '04 / other passions',
    title: 'Other passions',
    shortTitle: 'the things I love',
    preview: 'Photography, Minecraft, and the pleasure of looking closely.',
    description: 'The things that keep the technical work playful.',
    accent: '☼',
    items: [
      { title: 'Photography', text: 'Framing ordinary moments and looking closely.' },
      { title: 'Minecraft', text: 'Creative sandbox, systems simulator, and shared world.' },
    ],
  },
  {
    id: 'contact',
    eyebrow: '05 / contact',
    title: 'Contact',
    shortTitle: 'say hello',
    preview: 'A few places to find me online.',
    description: 'Link destinations are ready to be added when they are available.',
    accent: '♡',
    items: [
      { title: 'GitHub', text: 'Code, experiments, and works in progress.', tag: 'add link' },
      { title: 'LinkedIn', text: 'The professional version of hello.', tag: 'add link' },
      { title: 'Email', text: 'A note, idea, question, or rabbit hole.', tag: 'add link' },
    ],
  },
]

export const topicById = Object.fromEntries(topics.map((topic) => [topic.id, topic])) as Record<TopicId, Topic>
