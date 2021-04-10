const package = require('../../package.json');

module.exports = {
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
      { text: 'Introduction', link: '/introduction' },
      { text: 'Installation', link: '/installation' },
      { text: 'Usage', link: '/usage' },
      { text: 'About', link: '/about' },
      { text: 'GitHub', link: 'https://github.com/Sanofi-IADC/konviw' },
    ],
    // sidebar: 'auto',
    sidebar: [
      {
        title: 'Introduction', // required
        path: '/introduction', // optional, link of the title, which should be an absolute path and must exist
        collapsable: false, // optional, defaults to true
        // sidebarDepth: 2, // optional, defaults to 1
      },
      {
        title: 'Installation',
        path: '/installation', // optional, link of the title, which should be an absolute path and must exist
        // sidebarDepth: 2, // optional, defaults to 1
      },
      {
        title: 'Usage',
        path: '/usage', // optional, link of the title, which should be an absolute path and must exist
      },
      {
        title: 'Demo', // required
        collapsable: true, // optional, defaults to true
        children: [
          '/demoIntroduction',
          '/demoNoTitle',
          '/demoStyles',
          '/demoComments',
          '/demoBlogPost',
          '/demoSlidesDocs',
        ],
      },
      '/about',
    ],
  },
  plugins: ['@vuepress/back-to-top'],
  markdown: {
    extendMarkdown: (md) => {
      md.set({ breaks: true });
      // markdown-it plugins
      md.use(require('markdown-it-task-lists'));
    },
  },
};
