const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const http = require('http');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 6969; // Use environment port if available

app.use(bodyParser.json());
app.use(express.static('public'));

const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not defined in the environment variables');
}

function buildPrompt(prePromptContent, lastMessage) {
    return `${prePromptContent}\n${lastMessage}`;
}

io.on('connection', (socket) => {
    console.log('A user connected');

    // Spawn a new worker for each user
    const worker = child_process.fork('./worker.js');

    let conversation = [];

    worker.on('message', (response) => {
        console.log('OpenAI API Response:', response);

        const result = response.choices[0].text.trim();
        conversation.push(`AI: ${result}`); // Add the model's response to the conversation

        if (conversation.length > 10) {
            console.log('Resetting conversation context...');
            conversation = conversation.slice(-5); // Keep the last 5 messages
        }

        socket.emit('chat message', result); // Send the result to the client
    });

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

            // Build the full prompt with the last message only
            const prompt = buildPrompt(prePromptContent, `You: ${message}`);

            // Send the prompt to the worker
            worker.send({ prompt });
        } catch (error) {
            console.error('OpenAI request failed:', error);
            socket.emit('chat error', 'Failed to get a response from OpenAI.');
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        worker.kill(); // Kill the worker when the user disconnects
    });
});

// Add the /bambi endpoint
app.get('/bambi', (req, res) => {
    res.send('Hello Bambi');
    });

server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on https://bambisleep.chat:${port}`);
}).on('error', (err) => {
    console.error('Error occurred while starting the server:', err);
});