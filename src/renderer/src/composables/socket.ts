import { io } from "socket.io-client";

const socket = io("http://localhost:3123");

socket.on("connect", async () => {
  console.log("connected");
});

export function useSocket() {
  const getTracks = () => {
    return new Promise((resolve) => {
      socket.emit("tracks", {}, (tracks: any) => {
        console.log(tracks)
        resolve(tracks);
      });
    });
  };

  const playStem = (stem: any) => {
    socket.emit("play", {
      payload: {
        settings: {
          stem: stem.path,
        }
      }
    });
  }

  return {
    getTracks,
    playStem,
    socket,
  };
}
