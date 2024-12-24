const WebSocket = require('ws');

// กำหนดข้อมูลการเชื่อมต่อไปยัง WebSocket server ของตัวแรก
const HOST = "ws://191.20.207.53:81/ws";  // IP และพอร์ตของ server ตัวแรก
const ws = new WebSocket(HOST);

// ฟังก์ชันเมื่อเชื่อมต่อ WebSocket สำเร็จ
ws.on('open', function open() {
    console.log('Connected to WebSocket server (Server 1)');

    const registerMessage = {
        event: "register",
        id: "clientA", // ระบุ ID ของ client (ต้องไม่ซ้ำกับ client อื่น)
    };

    ws.send(JSON.stringify(registerMessage)); // ส่งข้อความ register ไปยัง server
    console.log('Sent register event:', registerMessage);

    // ส่งข้อมูลทุกๆ 1 วินาที
    setInterval(() => {
        const sensorId = Math.floor(Math.random() * 12) + 1;  // สุ่ม sensor ID (ตัวอย่าง)
        const distance = Math.floor(Math.random() * 100);  // สุ่มค่า distance (ตัวอย่าง)
        const condition = Math.floor(Math.random() * 4) + 1;  // สุ่ม condition (1-4)

        // สร้างข้อความที่ต้องการส่ง
        const message = {
            event: "message_esp",
            type: "trigger",
            message: `Sensor:${sensorId},Distance:${distance}`,
            condition: condition
        };

        // ส่งข้อความที่สร้างขึ้นไปที่ WebSocket server
        ws.send(JSON.stringify(message));
        console.log('Sent:', message);
    }, 1000);  // ทุกๆ 1 วินาที
});

// ฟังก์ชันสำหรับรับข้อความจาก WebSocket server
ws.on('message', function incoming(data) {
    console.log('Received from server (Server 1):', data);
});

// ฟังก์ชันสำหรับจัดการเมื่อเชื่อมต่อถูกปิด
ws.on('close', function close() {
    console.log('Disconnected from WebSocket server');
});

// ฟังก์ชันสำหรับจัดการข้อผิดพลาด
ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
});