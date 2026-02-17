const axios = require('axios');

module.exports = async (query) => {
  const { url } = query;
  const screenshotUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&access_key=${process.env.SCREENSHOT_KEY || 'YOUR_KEY'}&format=jpg&viewport_width=1280&viewport_height=800`;
  return {
    status: true,
    url,
    screenshot: screenshotUrl,
    message: 'Ganti YOUR_KEY dengan access key dari screenshotone.com'
  };
};
