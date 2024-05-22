const axios = require('axios');
require('dotenv').config();

const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not defined in the environment variables');
}

let tabId;

process.on('message', async ({ prompt, id }) => {
    // If this is the first message, set the tabId
    if (!tabId) {
        tabId = id;
    }

    // If the ID of the incoming message doesn't match the tabId, ignore the message
    if (id !== tabId) {
        return;
    }

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/completions',
            {
                model: 'gpt-3.5-turbo-instruct-0914', // Using the specified model
                prompt: prompt,
                max_tokens: 150
            },
            {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        process.send(response.data);
    } catch (error) {
        console.error('OpenAI request failed:', error);
    }
});