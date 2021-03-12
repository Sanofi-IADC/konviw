module.exports = {
  title: 'konviw',
  description: 'Enterprise public viewer for your Confluence pages.',
  base: '/konviw/', // when published to GitHub Pages
  // base: '/', // when rendered locally
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'About', link: '/about' },
      { text: 'GitHub', link: 'https://github.com/Sanofi-IADC/konviw' },
    ],
    sidebar: [
      { text: 'Introduction', link: '/introduction' },
      { text: 'Installation', link: '/installation' },
      { text: 'About', link: '/about' },
    ],
  },
  // markdown: {
  //   config: (md) => {
  //     // markdown-it plugins
  //     md.use(require('markdown-it-task-lists'));
  //   },
  // },
};
