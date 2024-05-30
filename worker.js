const axios = require('axios');
require('dotenv').config();

const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not defined in the environment variables');
}

let tabId;
let idleTimer;

const idleTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds

// Function to shut down the worker
function shutdown() {
    process.exit();
}

process.on('message', async ({ prompt, id }) => {
    // If this is the first message, set the tabId
    if (!tabId) {
        tabId = id;
    }

    // If the ID of the incoming message doesn't match the tabId, ignore the message
    if (id !== tabId) {
        return shutdown();
    }

    // Worker disconected? Shutdown!
    if (!process.connected) {
    console.error('Worker disconected, Shutdown!');
    return shutdown();
    }

    // Reset the idle timer whenever a message is received
    clearTimeout(idleTimer);
    idleTimer = setTimeout(shutdown, idleTimeout);

    async function query(data) {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/UnfilteredAI/NSFW-gen-v2.1",
            {
                headers: { Authorization: "Bearer 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" },
                method: "POST",
                body: JSON.stringify(data),
            }
        );
        const result = await response.blob();
        return result;
    }
    query({"inputs": "Astronaut riding a horse"}).then((response) => {
        // Use image
    });
});