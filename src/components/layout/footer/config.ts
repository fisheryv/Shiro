import type { LinkSection, OtherInfo } from '~/app/config'

export const defaultLinkSections: LinkSection[] = [
  {
    name: '关于>',
    links: [
      {
        name: '关于本站',
        href: '/about-site',
      },
      {
        name: '关于我',
        href: '/about-me',
      },
    ],
  },
  {
    name: '更多>',
    links: [
      {
        name: '时间线',
        href: '/timeline',
      },
      {
        name: '友链',
        href: '/friends',
      },
    ],
  },
  {
    name: '联系>',
    links: [
      {
        name: '写留言',
        href: '/message',
      },
      {
        name: '发邮件',
        href: 'mailto:yverrr@gmail.com',
        external: true,
      },
      {
        name: 'GitHub',
        href: 'https://github.com/fisheryv',
        external: true,
      },
    ],
  },
]

export interface FooterConfig {
  linkSections: LinkSection[]
  otherInfo: OtherInfo
}
