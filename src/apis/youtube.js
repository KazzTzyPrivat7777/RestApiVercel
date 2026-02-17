const axios = require('axios');

module.exports = async (query) => {
  const { url, format = 'mp3' } = query;
  const { data } = await axios.get('https://yt-api.p.rapidapi.com/dl', {
    params: { id: url, cgeo: 'ID' },
    headers: {
      'x-rapidapi-key': process.env.RAPID_KEY || 'YOUR_RAPIDAPI_KEY',
      'x-rapidapi-host': 'yt-api.p.rapidapi.com'
    },
    timeout: 20000
  });
  return { status: true, format, data };
};
