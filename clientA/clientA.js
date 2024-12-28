const WebSocket = require('ws');

const HOST = 'ws://192.168.1.127:81/ws'; // refer to server
const ws = new WebSocket(HOST);

ws.on('open', function open() {
    console.log('Connected to WebSocket server (Server 1)');

    // register
    const registerMessage = {
        event: 'register',
        id: 'client-A',
    };

    ws.send(JSON.stringify(registerMessage));
    console.log('Sent register event:', registerMessage);

    // send every second
    setInterval(() => {
        const message = {
            event: 'mc_data',
            message: 'send data to client B '
        }

        ws.send(JSON.stringify(message));
        console.log('Sent:', message);
    }, 1000);
});

ws.on('message', function incoming(data) {
    console.log('Received from server (Server 1):', data);
});

ws.on('close', function close() {
    console.log('Disconnected from WebSocket server');
});

ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
});