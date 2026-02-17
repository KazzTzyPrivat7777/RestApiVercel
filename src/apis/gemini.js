const axios = require('axios');

module.exports = async (query) => {
  const { q } = query;
  const key = process.env.GEMINI_KEY || 'YOUR_GEMINI_KEY';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`;

  const { data } = await axios.post(url, {
    contents: [{ parts: [{ text: q }] }]
  }, { timeout: 15000 });

  const result = data.candidates[0].content.parts[0].text;
  return { status: true, result };
};
