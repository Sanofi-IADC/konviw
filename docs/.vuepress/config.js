module.exports = {
  // title: 'konviw',
  description: 'Enterprise public viewer for your Confluence pages.',
  base: '/konviw/', // when published to GitHub Pages
  // base: '/', // when rendered locally
  head: [['link', { rel: 'icon', href: '/konviw.png' }]],
  themeConfig: {
    logo: '/konviw.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Introduction', link: '/introduction' },
      { text: 'Installation', link: '/installation' },
      { text: 'Usage', link: '/usage' },
      { text: 'About', link: '/about' },
      { text: 'GitHub', link: 'https://github.com/Sanofi-IADC/konviw' },
    ],
    sidebar: 'auto',
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
