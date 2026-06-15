import http from "node:http"
import fs from "node:fs/promises"
import path from "path"
import {WebSocketServer } from 'ws'

import { redisPublish,redisSubscribe } from "./connection.js" 
const PORT = process.env.PORT ?? 9000
const REDIS_CHANNEL='ws-messages'

//fs.readFileSync() is synchronous and blocking, meaning Node.js stops processing other requests until the file is fully read, which can hurt performance when many users access the server simultaneously. In contrast, await fs.readFile() from node:fs/promises is asynchronous and non-blocking, allowing Node.js to continue handling other requests while the file is being read, resulting in better scalability and throughput. For serving a static file like index.html, the most efficient approach is usually to read the file once when the server starts and reuse the cached content for every request.

const indexFile = await fs.readFile(path.resolve('./index.html'), 'utf-8')

const httpServer = http.createServer((req, res) =>{
    // const indexFile = await fs.readFile(path.resolve('./index.html'), 'utf-8')
    res.setHeader('Content-Type', 'text/html')
    return res.end(indexFile)
}) 

//Attaches WebSocket server to the same HTTP server.
const wsServer = new WebSocketServer({server:httpServer})
redisSubscribe.subscribe(REDIS_CHANNEL)
redisSubscribe.on('message', (channel, message) => {
    if (channel === REDIS_CHANNEL) {
       wsServer.clients.forEach((client) => {
            client.send(message)
        }) 
    }
})

//associating a handler for that connection
wsServer.on('connection', (websocket) => {
    console.log(`Websocket connection..`)
    //this is send to only to that client that sends the msg
    websocket.on('message', async (data) => {
           console.log("websocket message received", data.toString()) 
        // this broadcasts to all clients
        // wsServer.clients.forEach((client) => {
        //     client.send(data.toString())
        // })

        //relay the message to broker
        console.log('relaying msg to redis')
        await redisPublish.publish(REDIS_CHANNEL,data.toString())
    })
    
});

httpServer.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
});