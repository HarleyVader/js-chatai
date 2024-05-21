const cluster = require('cluster');
const os = require('os');
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const http = require('http');
require('dotenv').config();

const numWorkers = 1; // os.cpus().length; // Use all available CPU cores

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

    io.on('connection', (socket) => {
        console.log('A user connected');

        socket.on('chat message', async (message) => {
            try {
                if (!message) {
                    console.error('Message is required.');
                    return;
                }

                console.log('Received message:', message);

                const response = await axios.post(
                    'https://api.openai.com/v1/completions',
                    {
                        model: 'gpt-3.5-turbo-instruct-0914',  // Specify the model you wish to use from the posbile options below
                        /* 
                        davinci-002
                        babbage-002
                        gpt-4
                        gpt-4-turbo
                        gpt-4-0613
                        gpt-3.5-turbo
                        gpt-3.5-turbo-0613
                        gpt-3.5-turbo-1106
                        gpt-3.5-turbo-instruct-0914
                        gpt-3.5-turbo-0301
                        gpt-3.5-turbo-0125
                        */
                        prompt: message,
                        max_tokens: 150,
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
                io.emit('chat message', result);
            } catch (error) {
                console.error('OpenAI request failed:', error);
                io.emit('chat error', 'An error occurred while processing your message');
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