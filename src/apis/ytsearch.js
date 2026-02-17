const axios = require('axios');

module.exports = async (query) => {
  const { q } = query;
  const { data } = await axios.get('https://www.youtube.com/results', {
    params: { search_query: q },
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 15000
  });
  const match = data.match(/var ytInitialData = ({.*?});<\/script>/s);
  if (!match) return { status: false, message: 'Gagal parsing data YouTube' };
  const json = JSON.parse(match[1]);
  const items = json?.contents?.twoColumnSearchResultsRenderer?.primaryContents
    ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
  const results = items
    .filter(i => i.videoRenderer)
    .slice(0, 10)
    .map(i => {
      const v = i.videoRenderer;
      return {
        id: v.videoId,
        title: v.title?.runs?.[0]?.text,
        url: 'https://youtube.com/watch?v=' + v.videoId,
        thumbnail: v.thumbnail?.thumbnails?.pop()?.url,
        duration: v.lengthText?.simpleText,
        views: v.viewCountText?.simpleText,
        channel: v.ownerText?.runs?.[0]?.text
      };
    });
  return { status: true, query: q, count: results.length, results };
};
