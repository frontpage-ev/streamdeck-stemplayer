import { defineStore } from "pinia";
import { Ref, ref } from "vue";

export interface Stem {
  tackName: string;
  name: string;
  path: string;
  active: boolean;
  playing: boolean;
  volume: number;
  loopStart: number | null;
  loopEnd: number | null;
}

export interface Track {
  name: string;
  stems: Stem[];
}

export interface Stream {
  path: string;
  audio: HTMLAudioElement,
}

export const useTrackStore = defineStore("tracks", () => {
  const tracks: Ref<Track[]> = ref([]);
  const streams: Ref<Stream[]> = ref([]);
  const currentTrack: Ref<Track | null> = ref(null);
  const playingPath: Ref<string | null> = ref(null);
  const pausedPath: Ref<string | null> = ref(null);
  const fading: Ref<boolean> = ref(false);

  /**
   * Fade out all streams (reduce volume to 0 within given duration in ms)
   * After fading out, delete the stream from the array
   */
  const destroyAllStreams = (duration: number) => {
    const streamsCopy = [...streams.value];
    streams.value = [];
    fadeOutStreams(streamsCopy, duration);
  };

  const fadeOutStreams = (streams: Stream[], duration: number) => {
    fading.value = true;
    console.log("fade out", streams.length, "streams", duration, "ms");
    const interval = 10;
    const steps = duration / interval;
    const stepVolume = 1 / steps;
    let currentStep = 0;
    const intervalId = setInterval(() => {
      currentStep++;
      streams.forEach((stream: Stream) => {
        stream.audio.volume = Math.max(stream.audio.volume - stepVolume, 0);
      });

      if (currentStep === steps) {
        clearInterval(intervalId);
        console.log("fade out finished");
        fading.value = false;
      }
    }, interval);
  };

  const fadeInStreams = (streams: Stream[], duration: number) => {
    fading.value = true;
    console.log("fade in", streams.length, "streams", duration, "ms");
    const interval = 10;
    const steps = duration / interval;
    const stepVolume = 1 / steps;
    let currentStep = 0;
    const intervalId = setInterval(() => {
      currentStep++;
      streams.forEach((stream: Stream) => {
        stream.audio.volume = Math.min(stream.audio.volume + stepVolume, 1);
      });

      if (currentStep === steps) {
        clearInterval(intervalId);
        console.log("fade in finished");
        fading.value = false;
      }
    }, interval);
  };

  const fadeMixStreams = (streams: Stream[], duration: number) => {
    // set volume for all streams to 0, except the new one
    const stemsToFadeOut = streams.filter(
      (stream: Stream) => stream.path !== playingPath.value
    );
    const stemsToFadeIn = streams.filter(
      (stream: Stream) => stream.path === playingPath.value
    );

    fadeInStreams(stemsToFadeIn, duration);
    fadeOutStreams(stemsToFadeOut, duration);
  };

  const setActiveStem = (path: string) => {
    const track = tracks.value.find(
      (track: any) => track.stems.find((stem: any) => stem.path === path)
    );

    if (track) {
      playingPath.value = path;
      pausedPath.value = null;
      const trackChanged = currentTrack.value !== track;
      currentTrack.value = track;
      if (trackChanged) destroyAllStreams(1000);

      // disable all stems in all tracks
      tracks.value.forEach((track: any) => {
        track.stems.forEach((stem: any) => {
          stem.active = false;
          stem.playing = false;
        });
      });

      // enable the stem for the given track
      track.stems.forEach((stem: any) => {
        stem.active = true;

        if (stem.path === path) {
          stem.playing = true;
        }
      });

      if (trackChanged) {
        console.log("register all music");
        // create new stream for all stems
        streams.value = track.stems
          .map((stem: any) => {
            const stream = new Audio(stem.path);
            stream.volume = 0;
            stream.loop = true;
            stream.play();

            return {
              path: stem.path,
              audio: stream
            };
          });
      } else {
        // switch
        console.log("switch music to the new stem");
      }

      fadeMixStreams(streams.value, 1000);
    }
  };

  const stopAllTracks = () => {
    console.log("stop all tracks");
    fadeOutStreams(streams.value, 1000);
    pausedPath.value = playingPath.value;
  };

  const toggleAllTracks = () => {
    console.log("toggle all tracks");
    // toggle all streams
    if (pausedPath.value) {
      fadeMixStreams(streams.value, 1000);
      pausedPath.value = null;
    } else {
      fadeOutStreams(streams.value, 1000);
      pausedPath.value = playingPath.value;
    }
  };

  return {
    tracks,
    streams,
    setActiveStem,
    stopAllTracks,
    toggleAllTracks,
    fading
  };
});
