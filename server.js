const cluster = require('cluster');
const child_process = require('child_process');
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

if (cluster.isMaster) {
    console.log(`Master process is running with PID ${process.pid}.`);

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

        const worker = child_process.fork('./path/to/worker/script.js');

        // Handle messages from the worker
        worker.on('message', (message) => {
            console.log(`Received message from worker: ${message}`);
        });

        // Handle worker exit
        worker.on('exit', (code, signal) => {
            console.log(`Worker exited with code ${code} and signal ${signal}`);
        });

        // Handle worker error
        worker.on('error', (err) => {
            console.error('Error occurred in worker:', err);
        });

        // Send a message to the worker
        worker.send('start');

        let conversation = [];

        socket.on('chat message', async (message) => {
            try {
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
                conversation.push(`${result}`); // Add the model's response to the conversation

                if (conversation.length > 10) {
                    console.log('Resetting conversation context...');
                    conversation = conversation.slice(-5); // Keep the last 5 messages
                }

                // io.emit('chat message', result);
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