const axios = require('axios');

module.exports = async (query) => {
  const { url } = query;
  const { data } = await axios.get('https://api.tikmate.app/api/lookup', {
    params: { url },
    timeout: 15000
  });
  return { status: true, data };
};
