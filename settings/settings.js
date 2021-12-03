const LAUNCH_PUPPETEER_OPTS = {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1920x1080",
    ],
  };
  
  const PAGE_PUPPETEER_OPTS = {
    networkIdle2Timeout: 50000,
    waitUntil: "networkidle0",
    timeout: 300000,
  };
  
  const VIEWPORT = {
    width: 1920,
    height: 3556,
  };
  
  module.exports = {
    LAUNCH_PUPPETEER_OPTS,
    PAGE_PUPPETEER_OPTS,
    VIEWPORT
  };