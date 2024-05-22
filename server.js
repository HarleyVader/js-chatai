const cluster = require('cluster');
const os = require('os');
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const numWorkers = 1 //os.cpus().length; // Use all available CPU cores

if (cluster.isMaster) {
    console.log(`Master process is running with PID ${process.pid}. Creating ${numWorkers} workers.`);

    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });
} else {
    const app = express();
    const server = http.createServer(app);
    const io = socketIo(server);
    const port = process.env.PORT || 3000; // Use environment port if available

    app.use(bodyParser.json());
    app.use(express.static('public'));

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY is not defined in the environment variables');
    }

    // Function to construct the prompt
    function buildPrompt(prePromptContent, conversation) {
        const conversationHistory = conversation.join('\n');
        return `${prePromptContent}\n${conversationHistory}`;
    }

    io.on('connection', (socket) => {
        console.log('A user connected');

        let conversation = [];

        socket.on('chat message', async (data) => {
            console.log('Received data:', data);

            try {
                let { message } = data;

                if (!message) {
                    console.error('Message is required.');
                    return;
                }

                console.log('Received message:', message);

                // Read the pre-prompt content from the file
                const templatePath = path.join(__dirname, '/public/templates/bambisleep.json');

                if (!fs.existsSync(templatePath)) {
                    console.error('Template file does not exist.');
                    return;
                }

                const prePromptContent = fs.readFileSync(templatePath, 'utf8');

                // Add the new message to the conversation history
                conversation.push(`You: ${message}`);

                // Build the full prompt
                const prompt = buildPrompt(prePromptContent, conversation);

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

                console.log('OpenAI API Response:', response.data);

                const result = response.data.choices[0].text.trim();
                conversation.push(`AI: ${result}`); // Add the model's response to the conversation

                if (conversation.length > 10) {
                    console.log('Resetting conversation context...');
                    conversation = conversation.slice(-5); // Keep the last 5 messages
                }

                io.emit('chat message', result);
            } catch (error) {
                console.error('OpenAI request failed:', error);
                socket.emit('chat error', 'Failed to get a response from OpenAI.');
            }
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });

    server.listen(port, () => {
        console.log(`Worker ${process.pid} started. Server is running on http://localhost:${port}`);
    }).on('error', (err) => {
        console.error('Error occurred while starting the server:', err);
    });
}