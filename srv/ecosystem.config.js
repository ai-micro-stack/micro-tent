/*
pm2 start ecosystem.config.js -i max
pm2 save
pm2 startup
*/
module.exports = {
  apps: [
    {
      name: "micro-stack",
      script: "./server.js",

      /* runn app in cluster mode*/
      // exec_mode: "cluster",
      /* lauch instances as max cup number -1 */
      // instances: -1,

      /* how many times the auto-restart will be triggerd */
      max_restarts: 16,

      /* restart delay increased by 1.5 each time, back to default while app running normal 30 sec */
      exp_backoff_restart_delay: 100,
      /* triger restart when off-line time span reached */
      min_uptime: 5000, // 5 seconds

      /* restart app once it reaches the memory limit */
      // max_memory_restart: "8G",

      /* make a fixed app restart with a cron schedule */
      // cron_restart: "0 */24 * * *",
    },
  ],
};
