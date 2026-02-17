const axios = require('axios');

module.exports = async (query) => {
  const { data } = await axios.get('https://kayzzidgf.my.id/api/ai/dyronai', {
    params: { q: query.q, apikey: 'KazzPrivate' },
    timeout: 15000
  });
  return { status: true, data };
};
