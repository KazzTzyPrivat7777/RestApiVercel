const axios = require('axios');

const sessions = {};

module.exports = async (query) => {
  const { q, session } = query;
  const sid = session || 'default';

  if (!sessions[sid]) sessions[sid] = [];
  sessions[sid].push({ role: 'user', content: q });

  const systemPrompt = 'Kamu adalah Aoshi, asisten AI yang cerdas, ramah, dan suka bercanda. Jawab dalam bahasa Indonesia yang santai.';

  const { data } = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      ...sessions[sid].slice(-10)
    ]
  }, {
    headers: { Authorization: 'Bearer ' + (process.env.OPENAI_KEY || 'YOUR_OPENAI_KEY') },
    timeout: 15000
  });

  const reply = data.choices[0].message.content;
  sessions[sid].push({ role: 'assistant', content: reply });

  return { status: true, result: reply, session: sid };
};
