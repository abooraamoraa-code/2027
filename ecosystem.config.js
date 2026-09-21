/**
 * ============================================================================
 * MODULE: PM2 Enterprise Process Manager Configuration
 * إدارة وتطوير: أبو العز العمري
 * ============================================================================
 */

module.exports = {
  apps: [
    {
      name: 'abu-elizz-enterprise-platform',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '500M',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
      time: true
    }
  ]
};
