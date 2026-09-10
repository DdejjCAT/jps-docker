#!/bin/bash
D=:99
mkdir -p /tmp/xdg99 && chmod 700 /tmp/xdg99
export DISPLAY=$D XDG_RUNTIME_DIR=/tmp/xdg99
if [ "${GAME:-jps}" = "jpp2" ]; then
  BIN=/game/bin/TJPP2_OpenGL
else
  BIN=/game/bin/TJPS_OpenGL
fi
export LD_LIBRARY_PATH=/game/bin/lib
rm -f /tmp/.X99-lock /tmp/.X11-unix/X99

# --- аудио: pulseaudio + null-sink, WS+PCM стрим через ws_audio_server.py ---
export PULSE_SERVER=unix:$XDG_RUNTIME_DIR/pulse/native
export PULSE_SINK=vsink SDL_AUDIODRIVER=pulse
rm -rf $XDG_RUNTIME_DIR/pulse
for r in 1 2 3; do
  pulseaudio --daemonize=yes --exit-idle-time=-1 --load="module-null-sink sink_name=vsink rate=48000 channels=2" >/tmp/pulse.log 2>&1
  [ -S "$PULSE_SERVER" ] && break
  sleep 2
done
for i in $(seq 1 20); do [ -S "$PULSE_SERVER" ] && break; sleep 0.5; done
PULSE_SERVER="$PULSE_SERVER" pactl set-default-sink vsink >/dev/null 2>&1 || true
PULSE_SERVER="$PULSE_SERVER" pactl set-default-source vsink.monitor >/dev/null 2>&1 || true

# WS+PCM вместо HTTP-MP3 (MP3 буферизуется gh-туннелем на 15-20с)
if python3 -c 'import websockets' 2>/dev/null && [ -f /opt/ws_audio_server.py ]; then
  setsid nohup python3 /opt/ws_audio_server.py >/tmp/ws_audio.log 2>&1 < /dev/null &
fi

setsid nohup Xvnc -interface 0.0.0.0 -disableBasicAuth -RectThreads 8 \
  -Log *:stdout:20 -httpd /usr/share/kasmvnc/www -sslOnly 0 \
  -SecurityTypes None -websocketPort 6911 -FreeKeyMappings \
  -geometry 1280x720x24 -localhost no $D >/tmp/kasm.log 2>&1 &
cp -f /kasmx.js /usr/share/kasmvnc/www/kasmx.js 2>/dev/null || true
grep -q kasmx.js /usr/share/kasmvnc/www/vnc.html 2>/dev/null || sed -i "s|<body>|<body><script src=kasmx.js></script>|" /usr/share/kasmvnc/www/vnc.html 2>/dev/null || true
for i in $(seq 1 30); do DISPLAY=$D xdpyinfo >/dev/null 2>&1 && break; sleep 1; done
DISPLAY=$D xdpyinfo >/dev/null 2>&1 || { echo KASM-FAIL; tail -20 /tmp/kasm.log; exit 1; }
DISPLAY=$D openbox &>/dev/null & sleep 1
cd /game/bin || true
DISPLAY=$D setsid nohup $BIN >/tmp/game.log 2>&1 &
sleep 22
echo "GAME: $(pgrep -af "TJPS_OpenGL|TJPP2_OpenGL" | head -1)"
echo "WINDOW: $(DISPLAY=$D xdotool search --name "The Jackbox" 2>/dev/null | head -1)"
echo "AUDIO: $(pgrep -af 'ws_audio_server|ffmpeg' | head -2)"
echo CONTAINER-READY
tail -f /dev/null