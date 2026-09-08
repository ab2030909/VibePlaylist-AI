const { handler } = require('./index.js');
const event = {
    body: JSON.stringify({ idea: "Test idea", vibe: "Chill" })
};
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "your_groq_api_key_here";
handler(event).then(res => console.log(res));

