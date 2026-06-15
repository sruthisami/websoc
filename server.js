import http from "node:http"
import fs from "node:fs"
import path from "path"
import {WebSocketServer } from 'ws'

const PORT =process.env.PORT ??9000
const httpServer = http.createServer(async (req, res) =>{
    const indexFile = fs.readFileSync(path.resolve('./index.html'), 'utf-8')
    res.setHeader('Content-Type', 'text/html')
    return res.end(indexFile)
}) 

//Attaches WebSocket server to the same HTTP server.
const wsServer = new WebSocketServer({server:httpServer})

wsServer.on('connection', (websocket) => {
    console.log(`Websocket connection..`)
    websocket.on('message', (data) => {
        console.log("websocket message received")
    })
});

httpServer.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
});