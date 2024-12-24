const express = require("express");
const WebSocket = require("ws");

const HOST = "191.20.207.53"; // กำหนด IP ของเซิร์ฟเวอร์
const PORT = 81;               // กำหนดพอร์ต
const PATH = "/ws";            // กำหนด path สำหรับ WebSocket

const idsCon1 = [1, 2, 3, 4, 5, 6];  // กำหนดชุดของ sensor ids สำหรับ condition 1
const idsCon2 = [8, 9, 10, 11, 12];  // กำหนดชุดของ sensor ids สำหรับ condition 2
const idsCon3 = [2, 3, 4, 5];        // กำหนดชุดของ sensor ids สำหรับ condition 3
const idsCon4 = [8, 9, 10, 11];      // กำหนดชุดของ sensor ids สำหรับ condition 4

const app = express();

// สร้าง HTTP server
const server = app.listen(PORT, HOST, () => {
    console.log(`Server is running at http://${HOST}:${PORT}`);
});

// สร้าง WebSocket server
const wss = new WebSocket.Server({ server, path: PATH });



// ฟังก์ชันในการส่งข้อมูลจริง
async function sendSensorData(ws, messageContent, condition) {
    const data = {
        event: "sensor_data",
        type: "trigger",
        message: {  // ปรับโครงสร้างข้อมูลให้เหมือนกันทั้ง test และ ESP
            condition: condition,
            foundIDs: messageContent.foundIDs,
            notFoundIDs: messageContent.notFoundIDs
        },
        condition: condition
    };

    try {
        // ตรวจสอบการเชื่อมต่อและส่งข้อมูล
        if (ws.readyState !== WebSocket.OPEN) {
            console.error("WebSocket connection not open");
            return;
        }
        if (ws.readyState === WebSocket.OPEN) {
            await new Promise((resolve, reject) => {
                ws.send(JSON.stringify(data), (err) => {
                    console.log(data);
                    if (err) reject(err);
                    else resolve();
                });
            });
            // console.log("Sending data to client:", data);
        } else {
            console.error("WebSocket connection not open");
        }
    } catch (err) {
        console.error("Error sending data:", err);
    }
}

// ฟังก์ชันสำหรับประมวลผลข้อมูลจากเซ็นเซอร์
async function processSensors(messageContent, ids, condition, ws, sensorData) {
    console.log('Input to processSensors:', {
        messageContent,
        ids,
        condition
    });

    const sensorDataParts = messageContent.split(",");
    // console.log('Sensor data parts:', sensorDataParts);

    const sensor = parseInt(sensorDataParts[0].split(":")[1]);
    const distance = parseInt(sensorDataParts[1].split(":")[1]);

    // console.log(`Sensor: ${sensor}, Distance: ${distance}`);

    if (!sensorData.some(item => item.id === sensor) && ids.includes(sensor)) {
        sensorData.push({ id: sensor, distance: distance });
    }

    const foundSensors = sensorData
        .map(item => item.id)
        .filter(id => ids.includes(id));
    const notFoundSensors = ids.filter(id => !foundSensors.includes(id));

    const responseData = {
        // event: "message_esp", 
        data: {
            type: 'trigger',
            condition: condition,
            foundIDs: foundSensors.join(', '),
            notFoundIDs: notFoundSensors.join(', ')
        }
    };

    // ส่งข้อมูลผ่าน WebSocket
    return await sendSensorData(ws, responseData.data, condition);

}

const clients = new Map();

wss.on("connection", (ws) => {

    let sensorData = [];
    let currentCondition = null;

    // ส่งข้อความต้อนรับเมื่อเชื่อมต่อสำเร็จ
    ws.send(JSON.stringify({
        event: "welcome",
        message: "Connected to WebSocket Server!"
    }));

    // การรับข้อความจาก client
    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message);
            console.log(data);

            if (data.event === "register" && data.id) {
                ws.id = data.id; // เก็บ id ไว้ในตัว connection
                clients.set(ws.id, ws);
                console.log(`Client registered with id: ${ws.id}`);

                // ส่งข้อความยืนยันการลงทะเบียน
                ws.send(
                    JSON.stringify({
                        event: "registered",
                        message: `You are registered with id: ${ws.id}`,
                    })
                );
                return;
            }

            // ตรวจสอบว่าเป็นการส่งข้อความชนิด "trigger"

            if (data.event === "message_esp" && data.type === "trigger") {
                console.log(`Received message from client ${ws.id}:`);
                const messageContent = data.message.trim();
                const condition = parseInt(data.condition);

                if (currentCondition !== condition) {
                    console.log(`Condition changed from ${currentCondition} to ${condition}`);
                    sensorData = [];
                    currentCondition = condition;
                }

                // ถ้าต้องการส่งข้อมูลนี้ไปยัง clientB
                const clientB = clients.get("clientB");  // ใช้ ID ของ clientB ที่ลงทะเบียนไว้
                if (clientB) {
                    clientB.send(JSON.stringify({
                        event: "message_from_A",
                        message: data.message,
                        condition: data.condition
                    }));
                    console.log(`Sent message from clientA to clientB: ${data.message}`);
                } else {
                    console.log("clientB not found");
                }

                ws.send(JSON.stringify({
                    data: 'my_event',
                    message: 'hahahahah'
                }))
            } else {
                console.log('event not message_esp');
            }

        } catch (err) {
            console.error("Error processing message:", err);
            ws.send(JSON.stringify({
                event: "error",
                message: "Error processing message"
            }));
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });
});

// สร้าง route สำหรับ HTTP (ถ้าจำเป็น)
app.get("/", (req, res) => {
    res.send("WebSocket server is running!");
});