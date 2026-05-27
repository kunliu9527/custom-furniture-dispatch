module.exports = {
  apps: [
    {
      name: "dispatch",
      cwd: __dirname + "/..",
      script: "node_modules/next/dist/bin/next",
      args: "start --hostname 0.0.0.0 --port 3000",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
    },
  ],
};
