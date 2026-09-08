const https = require('https');

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event));

    // Handle CORS preflight
    if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            body: ''
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const idea = body.idea;
        const vibe = body.vibe;

        if (!idea || !vibe) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'idea and vibe are required' })
            };
        }

        const systemPrompt = `You are a creative music curator.
Generate exactly 8 real tracks that genuinely match the user's idea and vibe.
Prefer real, recognizable songs and artists.
Give the playlist a creative name and a short description.
The track selection must be diverse without repeating songs.
Do not include any explanations or extra text.
Return ONLY valid JSON. Do not return Markdown.

Expected structure:
{
  "title": "Creative Playlist Title",
  "description": "Short poetic description of the playlist.",
  "tracks": [
    {
      "title": "Song Title",
      "artist": "Artist Name"
    }
  ],
  "vibe": "Chill"
}`;

        const userPrompt = `Idea: ${idea}\nVibe: ${vibe}`;

        const requestBody = JSON.stringify({
            model: "llama-3.1-8b-instant", // Using a fast, standard Groq model
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            throw new Error("GROQ_API_KEY environment variable is not set");
        }

        const options = {
            hostname: 'api.groq.com',
            port: 443,
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        const groqResponse = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`Groq API returned status ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(requestBody);
            req.end();
        });

        const aiMessage = groqResponse.choices[0].message.content;
        
        // Parse to ensure it's valid JSON
        let playlistData;
        try {
            playlistData = JSON.parse(aiMessage);
        } catch (e) {
             throw new Error("Failed to parse Groq response as JSON: " + aiMessage);
        }

        // Validate structure
        if (!playlistData.title || !playlistData.tracks || !Array.isArray(playlistData.tracks) || playlistData.tracks.length !== 8) {
            console.error("Invalid playlist structure received:", playlistData);
            // We just return it anyway or try to format, let's just return what we have but maybe it's partially malformed.
        }

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify(playlistData)
        };

    } catch (error) {
        console.error('Error generating playlist:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'The music stopped for a moment. Please try again.' })
        };
    }
};
