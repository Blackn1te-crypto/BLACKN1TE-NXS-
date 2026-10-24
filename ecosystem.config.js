module.exports = {
  apps : [{
    name: "BLACKN1TE-NXS",
    script: "./server.js",
    watch: false,
    autorestart: true,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: "production",
    }
  }]
};