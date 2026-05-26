// PM2 Staging 配置 — AI经营助手 kimi-ai-assistant-mvp
// 端口: 3007 | NODE_ENV: staging
// ⚠️ 此配置仅用于 staging/test 环境

module.exports = {
  apps: [
    {
      name: "kimi-ai-assistant-mvp",
      script: "dist/boot.js",
      cwd: "/home/ubuntu/projects/kimi-ai-assistant-mvp",
      env: {
        NODE_ENV: "staging",
        PORT: 3007,
      },
      env_file: "/home/ubuntu/projects/kimi-ai-assistant-mvp/.env.staging",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "500M",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/home/ubuntu/projects/kimi-ai-assistant-mvp/logs/error.log",
      out_file: "/home/ubuntu/projects/kimi-ai-assistant-mvp/logs/out.log",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 5,
      restart_delay: 3000,
    },
  ],
};
