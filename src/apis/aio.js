const axios = require('axios');

module.exports = async (query) => {
  const { url } = query;
  const { data } = await axios.post('https://co.wuk.sh/api/json', {
    url,
    vCodec: 'h264',
    vQuality: '720',
    aFormat: 'mp3',
    isAudioOnly: false
  }, {
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    timeout: 20000
  });
  return { status: true, data };
};
