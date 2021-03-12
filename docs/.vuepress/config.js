module.exports = {
  // title: 'konviw',
  description: 'Enterprise public viewer for your Confluence pages.',
  base: '/konviw/', // when published to GitHub Pages
  // base: '/', // when rendered locally
  themeConfig: {
    logo: '/konviw.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Introduction', link: '/introduction' },
      { text: 'Installation', link: '/installation' },
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
