const axios = require('axios');

module.exports = async (query) => {
  const { prompt } = query;
  const { data } = await axios.get('https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt), {
    responseType: 'arraybuffer',
    timeout: 30000
  });
  const base64 = Buffer.from(data).toString('base64');
  return {
    status: true,
    prompt,
    url: 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt),
    base64: 'data:image/jpeg;base64,' + base64
  };
};
