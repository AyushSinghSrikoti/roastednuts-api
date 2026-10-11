import type { ProjectPlatform } from '@/domains/projects/types/platform.type';

export const PROJECT_PLATFORMS: ProjectPlatform[] = [
  {
    name: 'NestJS',
    slug: 'nestjs',
    iconUrl: 'https://cdn.simpleicons.org/nestjs/E0234E',
  },
  {
    name: 'Next.js',
    slug: 'nextjs',
    iconUrl: 'https://cdn.simpleicons.org/nextdotjs/2D2119',
  },
  {
    name: 'Node.js',
    slug: 'nodejs',
    iconUrl: 'https://cdn.simpleicons.org/nodedotjs/5FA04E',
  },
  {
    name: 'React',
    slug: 'react',
    iconUrl: 'https://cdn.simpleicons.org/react/3F7C87',
  },
  {
    name: 'Python',
    slug: 'python',
    iconUrl: 'https://cdn.simpleicons.org/python/3776AB',
  },
  { name: 'Go', slug: 'go', iconUrl: 'https://cdn.simpleicons.org/go/00ADD8' },
  { name: 'Other', slug: 'other', iconUrl: null },
];
