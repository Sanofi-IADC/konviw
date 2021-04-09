module.exports = {
  apps: [
    {
      name: 'Backend',
      script: './dist/src/main.js',
      exec_mode: 'cluster_mode',
      instances: 'max',
    },
  ],
};
