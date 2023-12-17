<template>
  <div class="p-4 h-full text-black bg-[#303030] select-none flex flex-col gap-4">
    <div class="bg-[#292929] border border-[#222222] text-[#efefef] p-4 rounded flex-col gap-4">
      <div class="flex justify-between">
        <div>
          Tracks Directory:
          <span class="text-white/50 bg-black/30 rounded px-2 py-0.5 select-text">
            %APPDATA%\.streamdeck-stemplayer\tracks
          </span>
        </div>
        <div>
          Open Audio Streams: {{ trackStore.streams.length }}
        </div>
      </div>
      <div>
        Reload Tracks with Ctrl+R
        <span class="text-zinc-500">(will stop all open streams)</span>
      </div>
    </div>

    <div class="bg-[#292929] border border-[#222222] text-[#efefef] p-4 rounded">

      <div v-for="track in trackStore.tracks">
        <div class="font-bold my-2">{{ track.name }}</div>
        <div class="grid gap-1">
          <template v-for="stem in track.stems">
            <div class="flex justify-between text-xs">
              <div
                :class="['px-3 py-1.5 rounded-full', {
                  'bg-zinc-500/[.15] text-zinc-300': !stem.active,
                  'bg-green-600/[.15] text-green-500': stem.active && !stem.playing,
                  'bg-rose-500/[.15] text-rose-400': stem.playing
                }]"
              >
                {{ stem.name }}
              </div>
              <div>
                <button
                  :class="['text-amber-600 font-bold py-1.5 px-4 rounded', {
                    'bg-amber-500/[.15] hover:bg-amber-700/[.15]': !fading,
                    'bg-gray-500/[.15] text-amber-600/[.15]': fading
                  }]"
                  :disabled="fading"
                  @click="socket.playStem(stem)"
                >
                  Transition
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSocket } from "./composables/socket";
import { onMounted } from "vue";
import { useTrackStore } from "./stores/tracks";
import { storeToRefs } from "pinia";

const socket = useSocket();
const trackStore = useTrackStore();
const { fading } = storeToRefs(trackStore);

socket.socket.on("play", (stem) => {
  if (stem.payload.settings?.stem) {
    trackStore.setActiveStem(stem.payload.settings.stem);
  } else {
    console.error("No settings found for stem", stem);
  }
});

socket.socket.on("stop", () => trackStore.stopAllTracks());
socket.socket.on("toggle", () => trackStore.toggleAllTracks());

onMounted(async () => {
  const tracks = await socket.getTracks() as any;
  console.log("tracks", tracks);
  // map tracks to store

  trackStore.tracks = tracks.map((track) => {
    return {
      name: track.name,
      stems: track.stems.map((stem) => {
        return {
          name: stem.name,
          path: stem.path,
          active: false,
          playing: false,
          volume: 1,
          loopStart: null,
          loopEnd: null
        };
      })
    };
  });
});
</script>
