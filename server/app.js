const express = require('express');
const WebSocket = require('ws');

const HOST = '191.20.207.53';
const PORT = 81;
const PATH = '/ws';           // WebSocket Path

const app = express();

// Create HTTP Server
const server = app.listen(PORT, HOST, () => {
    console.log(`Server is running at http://${HOST}:${PORT}`);
});

// WebSocket Server
const webSocket = new WebSocket.Server({ server, path: PATH });

const clients = new Map();

webSocket.on('connection', (ws) => {

    ws.send(JSON.stringify({
        event: 'welcome',
        message: 'Connected to WebSocket Server!'
    }));

    // Recieve Client Data
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log(data);

            if (data.event == 'register' && data.id) {
                ws.id = data.id; // set id to connection
                clients.set(ws.id, ws);
                console.log(`Client registered with id: ${ws.id}`);

                // Reponse to client 
                ws.send(
                    JSON.stringify({
                        event: 'registered',
                        message: `You are registered with id: ${ws.id}`,
                    })
                );
                return;
            }

            if (data.event == 'mc_data') {
                console.log('mc message', data.message)
            }

            const clientB = clients.get("Client-B");  // get client id registered
            if (clientB) {
                clientB.send(JSON.stringify({
                    event: "forward_mc_data",
                    message: data.message,
                }));
                console.log(`Sent message from Client-A to Client-B : ${data.message}`);
            } else {
                console.log("Client-B not found");
            }

        } catch (err) {
            console.error('Error processing message:', err);
            ws.send(JSON.stringify({
                event: 'error',
                message: 'Error processing message'
            }));
        }
    });

    // close client connection
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Http route
app.get('/', (req, res) => {
    res.send('WebSocket server is running!');
});