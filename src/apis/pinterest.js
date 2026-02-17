const axios = require('axios');

module.exports = async (query) => {
  const { q } = query;
  const { data } = await axios.get('https://www.pinterest.com/resource/BaseSearchResource/get/', {
    params: {
      source_url: `/search/pins/?q=${encodeURIComponent(q)}`,
      data: JSON.stringify({ options: { query: q, scope: 'pins', page_size: 20 } })
    },
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    timeout: 15000
  });
  const results = (data?.resource_response?.data?.results || []).map(p => ({
    id: p.id,
    title: p.title || p.grid_title,
    description: p.description,
    image: p.images?.orig?.url || p.images?.['736x']?.url
  }));
  return { status: true, query: q, count: results.length, results };
};
