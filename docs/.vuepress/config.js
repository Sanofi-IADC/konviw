const package = require('../../package.json');

module.exports = {
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
  themeConfig: {
    version: package.version,
    logo: '/konviw.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/introduction' },
      { text: 'Demo', link: '/demoIntroduction' },
      { text: 'About', link: '/about' },
      { text: 'Changelog', link: '/changelog' },
      { text: 'API', link: 'https://konviw.vercel.app/cpv/oas3' },
      { text: 'GitHub', link: 'https://github.com/Sanofi-IADC/konviw' },
    ],
    // sidebar: 'auto',
    sidebar: [
      {
        title: 'Introduction', // required
        path: '/introduction', // optional, link of the title, which should be an absolute path and must exist
      },
      {
        title: 'Installation',
        path: '/installation',
      },
      {
        title: 'Architecture',
        path: '/architecture',
      },
      {
        title: 'Performance',
        path: '/performance',
      },
      {
        title: 'Usage',
        path: '/usage',
      },
      {
        title: 'Demo',
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
    lastUpdated: 'Last Updated',
  },
  plugins: [
    '@vuepress/back-to-top',
    '@vuepress/google-analytics',
    // Plugin / Google Analytics options
    {
      ga: 'G-2VWWHG99CK',
    },
  ],
  markdown: {
    extendMarkdown: (md) => {
      md.set({ breaks: true });
      // markdown-it plugins
      md.use(require('markdown-it-task-lists'));
    },
  },
};
