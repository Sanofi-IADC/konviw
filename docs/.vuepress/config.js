const { path } = require('@vuepress/utils')
const package = require('../../package.json');

module.exports = {
  // site config
  title: package.name,
  description: package.description,
  lang: 'en-US',
  version: package.version,

  base: '/konviw/',
  head: [
    ['link', { rel: 'icon', href: '/konviw.png' }],
    ['meta', { property: 'og:image', content: '/konviw/konviw.svg' }],
    ['meta', { property: 'og:title', content: package.name }],
    ['meta', { property: 'og:description', content: package.description }],
    [
      'meta',
      { property: 'og:url', content: 'https://sanofi-iadc.github.io/konviw/' },
    ],
    ['meta', { property: 'og:site_name', content: package.name }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:site', content: '@jhgascon' }],
    ['meta', { name: 'twitter:title', content: package.name }],
    ['meta', { name: 'twitter:description', content: package.description }],
    ['meta', { name: 'twitter:creator', content: '@jhgascon' }],
    ['meta', { name: 'twitter:image', content: '/konviw/konviw.svg' }],
  ],

  // theme and its config
  theme: '@vuepress/theme-default',
  themeConfig: {
    version: package.version,
    logo: '/konviw.svg',
    navbar: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/introduction' },
      { text: 'Demo', link: '/demoIntroduction' },
      { text: 'About', link: '/about' },
      { text: 'Changelog', link: '/changelog' },
      { text: 'API', link: 'https://konviw.vercel.app/cpv/oas3' },
      { text: 'GitHub', link: 'https://github.com/Sanofi-IADC/konviw' },
    ],
    sidebarDepth: 1,
    sidebar: [
      '/Introduction',
      '/Installation',
      '/Architecture',
      '/Performance',
      '/Usage',
      {
        text: 'Demo',
        collapsible: true,
        children: [
          '/demoIntroduction',
          '/demoNoTitle',
          '/demoStyles',
          '/demoComments',
          '/demoBlogPost',
          '/demoSlidesDocs',
          '/demoJira',
          '/demoMultiFrame',
          '/demoCharts',
        ],
      },
      '/about',
    ],
  },
  plugins: [
    [
      '@vuepress/register-components',
      {
        componentsDir: path.resolve(__dirname, './components'),
      },
      '@vuepress/google-analytics',
      {
        ga: 'G-2VWWHG99CK',
      },
    ],
  ],
}