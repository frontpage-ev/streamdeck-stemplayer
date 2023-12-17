import fs from "fs";
import path from "path";
import { app } from "electron";

export interface InternalTrack {
  name: string;
  stems: {
    tackName: string;
    name: string;
    path: string;
  }[];
}

export function useFile() {
  const getTracks = () => {
    // read all folders from \.streamdeck-stemplayer\tracks and return them as Track[]

    return new Promise((resolve) => {
      const tracks: InternalTrack[] = [];
      const tracksPath = path.join(app.getPath("appData"), ".streamdeck-stemplayer", "tracks");
      console.log(tracksPath);
      // check if tracks folder exists
      if (!fs.existsSync(tracksPath)) {
        fs.mkdirSync(tracksPath, { recursive: true });
      }

      // remove extension from stemName
      fs.readdirSync(tracksPath).forEach(trackName => {
        const track: InternalTrack = {
          name: trackName,
          stems: []
        };
        fs.readdirSync(path.join(tracksPath, trackName)).forEach(stemName => {
          // return path as file:// url to be able to load it in the browser
          const file = path
            .join(tracksPath, trackName, stemName)
            .replaceAll(" ", "%20")
            .replaceAll(/\\/g, "/")
            .replace("C:", "file:///C:");

          track.stems.push({
            tackName: trackName,
            name: stemName.split(".")[0],
            path: file
          });
        });
        tracks.push(track);
      });
      resolve(tracks);
    });
  };

  return {
    getTracks
  };
}
