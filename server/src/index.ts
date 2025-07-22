import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "@colyseus/core";
import { monitor } from "@colyseus/monitor";
import { WebSocketTransport } from "@colyseus/ws-transport";

import { AdminRoom } from "./rooms/AdminRoom.js";

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server,
  }),
});

// Register AdminRoom
gameServer.define("admin_room", AdminRoom);

// Register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor());

gameServer.listen(port);
console.log(`🚀 Server listening on ws://localhost:${port}`); 