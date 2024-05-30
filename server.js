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

function buildPrompt(preprompt, lastMessage) {
    return `${preprompt} \n ${lastMessage}`;
}

function updateContext(context, userInput, botOutput) {
    let updatedContext = {...context};
    updatedContext.userInput = userInput;
    updatedContext.botOutput = botOutput;
    return updatedContext;
}

let clientCount = 0;

io.on('connection', async (socket) => {
    console.log('A user connected');
    clientCount++;
    console.log(`Number of connected clients: ${clientCount}`);

    // Spawn a new worker for each user
    const worker = child_process.fork('./worker.js');

    let conversation = [];
    let context = {};

    worker.on('message', (response) => {
        console.log('OpenAI API Response:', response);

        const result = response.choices[0].text.trim();
        conversation.push(`${result}`); // Add the model's response to the conversation
        context = updateContext(context, '', `${result}`);

        if (conversation.length > 10) {
            console.log('Resetting conversation context...');
            conversation = conversation.slice(-1); // Keep the last 5 messages
        }

        socket.emit('chat message', result); // Send the result to the client
    });

    socket.on('set preprompt', async (data) => {
        console.log('Received preprompt:', data);

        try {
            let { preprompt } = data;

            if (!preprompt) {
                console.error('Preprompt is required.');
                return;
            }

            console.log('Received preprompt:', preprompt);

            // Build the prompt using the received preprompt and the last message from the conversation
            const prompt = buildPrompt(preprompt, conversation[conversation.length - 1]);

            // Send the built prompt to the worker
            worker.send({ prompt });
        } catch (error) {
            console.error('OpenAI request failed:', error);
            socket.emit('chat error', 'Failed to get a response from OpenAI.');
        }
    });

    socket.on('chat message', async (data) => {
        console.log('Received data:', data);

        try {
            let { message, preprompt } = data;

            if (!message) {
                console.error('Message is required.');
                return;
            }

            console.log('Received message:', message);

            // Add the new message to the conversation history
            conversation.push(`${message}`);
            context = updateContext(context, `${message}`, '');

            // Use the pre-prompt from the client
            const prompt = `${preprompt}\n${message}`;

            // Send the prompt to the worker
            try {
                worker.send({ prompt });
            } catch (error) {
                console.error('Failed to send message to worker:', error);
            }

        } catch (error) {
            console.error('OpenAI request failed:', error);
            socket.emit('chat error', 'Failed to get a response from OpenAI.');
        }

        worker.on('exit', (code) => {
            console.log(`Worker exited with code ${code}`);
        });
        
        worker.on('error', (error) => {
            console.log('Worker encountered an error:', error);
        });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        clientCount--;
        console.log(`Number of connected clients: ${clientCount}`);
        worker.kill(); // Kill the worker when the user disconnects
    });
});

server.listen(port, () => {
    console.log(`Server is running on: ${port}`);
}).on('error', (err) => {
    console.error('Error occurred while starting the server:', err);
});