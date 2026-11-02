module.exports = {
  apps: [
    {
      name: 'meteora-poolmaker-finder',
      script: './src/index.js',
      args: '--daemon',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};

