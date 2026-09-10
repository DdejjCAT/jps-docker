#!/usr/bin/env python3
import asyncio
import subprocess
import os
import signal
import tempfile

import websockets

PORT = int(os.environ.get("WSAUDIO_PORT", "6912"))
RATE = int(os.environ.get("WSAUDIO_RATE", "48000"))
CH = int(os.environ.get("WSAUDIO_CH", "2"))
BITRATE = os.environ.get("WSAUDIO_BITRATE", "64k")

clients = set()
proc = None
buf = bytearray()
HEADER = 0
first_chunk = True

# ffmpeg: брать звук с null-sink монитора, выдавать сырой PCM (s16le) в stdout.
# Без HTTP listen — сразу в пайп, что исключает HTTP-буферизацию.
CMD = [
    "ffmpeg", "-hide_banner", "-loglevel", "error",
    "-fflags", "nobuffer", "-flags", "low_delay",
    "-f", "pulse", "-i", "vsink.monitor",
    "-ac", str(CH), "-ar", str(RATE),
    "-f", "s16le", "-",
]


loop = None


def read_and_schedule(loop):
    try:
        data = proc.stdout.read1(RATE * CH * 2)
        if not data:
            return
        if not clients:
            return
        loop.call_soon_threadsafe(loop.create_task, _send(data))
    except Exception:
        pass


async def _send(data):
    if not clients:
        return
    await asyncio.gather(*[c.send(data) for c in list(clients)], return_exceptions=True)


async def pump():
    global loop
    while True:
        if proc.poll() is not None:
            await asyncio.sleep(1)
            continue
        try:
            loop.add_reader(proc.stdout, read_and_schedule, loop)
        except Exception:
            pass
        await asyncio.sleep(5)


async def handler(ws):
    clients.add(ws)
    head = RATE.to_bytes(4, "little") + CH.to_bytes(4, "little")
    try:
        await ws.send(head)
        async for _ in ws:
            pass
    except Exception:
        pass
    finally:
        clients.discard(ws)


def ensure_ffmpeg():
    global proc, first_chunk
    if proc and proc.poll() is None:
        return
    first_chunk = True
    proc = subprocess.Popen(CMD, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)


async def main():
    global loop
    loop = asyncio.get_running_loop()
    ensure_ffmpeg()
    async with websockets.serve(handler, "0.0.0.0", PORT, max_size=2**20) as server:
        print(f"WSAUDIO listening {PORT} rate={RATE} ch={CH}", flush=True)
        task = asyncio.create_task(pump())
        try:
            await asyncio.gather(server.wait_closed())
        except asyncio.CancelledError:
            pass
        finally:
            task.cancel()
            if proc:
                proc.terminate()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass