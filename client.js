import { io } from "socket.io-client";

const socket = io("http://localhost:3123");

socket.on("connect", () => {
  console.log("Connected");
})
