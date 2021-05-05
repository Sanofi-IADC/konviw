const package = require('../../package.json');

module.exports = {
  title: package.name,
  description: package.description,
  version: package.version,
  base: '/konviw/', // when published to GitHub Pages
  // base: '/', // when rendered locally
  head: [['link', { rel: 'icon', href: '/konviw.png' }]],
  themeConfig: {
    version: package.version,
    logo: '/konviw.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/introduction' },
      { text: 'Demo', link: '/demoIntroduction' },
      { text: 'About', link: '/about' },
      { text: 'GitHub', link: 'https://github.com/Sanofi-IADC/konviw' },
    ],
    // sidebar: 'auto',
    sidebar: [
      {
        title: 'Introduction', // required
        path: '/introduction', // optional, link of the title, which should be an absolute path and must exist
        // sidebarDepth: 2, // optional, defaults to 1
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
        path: '/usage', // optional, link of the title, which should be an absolute path and must exist
        collapsable: false, // optional, defaults to true
      },
      {
        title: 'Demo', // required
        collapsable: true, // optional, defaults to true
        sidebarDepth: 1, // optional, defaults to 1
        children: [
          '/demoIntroduction',
          '/demoNoTitle',
          '/demoStyles',
          '/demoComments',
          '/demoBlogPost',
          '/demoSlidesDocs',
          '/demoJira',
          '/demoMultiFrame',
        ],
      },
      '/about',
    ],
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
