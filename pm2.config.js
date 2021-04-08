module.exports = {
  apps: [
    {
      name: 'Backend',
      script: './dist/main.js',
      exec_mode: 'cluster_mode',
      instances: 'max',
    },
  ],
};
