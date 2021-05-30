const package = require('../../package.json');

module.exports = {
  title: package.name,
  description: package.description,
  lang: 'en-US',
  version: package.version,
  base: '/konviw/',
  head: [['link', { rel: 'icon', href: '/konviw.png' }]],
  themeConfig: {
    version: package.version,
    logo: '/konviw.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/introduction' },
      { text: 'Demo', link: '/demoIntroduction' },
      { text: 'About', link: '/about' },
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
      {
        title: 'Code',
        path: '/code/modules',
      },
      '/about',
    ],
    lastUpdated: 'Last Updated',
  },
  plugins: [
    '@vuepress/back-to-top',
    '@vuepress/google-analytics',
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
