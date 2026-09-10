#!/bin/bash
D=:99
mkdir -p /tmp/xdg99 && chmod 700 /tmp/xdg99
export DISPLAY=$D XDG_RUNTIME_DIR=/tmp/xdg99 LD_LIBRARY_PATH=/game/bin/lib
rm -f /tmp/.X99-lock /tmp/.X11-unix/X99

# --- аудио: pulseaudio + null-sink, ffmpeg льёт MP3 на :6912 ---
export PULSE_SERVER=unix:/tmp/pulse.sock
pulseaudio --daemonize=yes --exit-idle-time=-1 --load="module-null-sink sink_name=vsink rate=48000 channels=2" >/tmp/pulse.log 2>&1 || true
sleep 3
setsid nohup ffmpeg -hide_banner -loglevel error -f pulse -i vsink.monitor -ac 2 -c:a libmp3lame -b:a 128k -f mp3 -listen 1 http://0.0.0.0:6912/stream.mp3 >/tmp/ffmpeg.log 2>&1 &
export SDL_AUDIODRIVER=pulse PULSE_SINK=vsink

setsid nohup Xvnc -interface 0.0.0.0 -disableBasicAuth -RectThreads 8 \
  -Log *:stdout:20 -httpd /usr/share/kasmvnc/www -sslOnly 0 \
  -SecurityTypes None -websocketPort 6911 -FreeKeyMappings \
  -geometry 1280x720x24 -localhost no $D >/tmp/kasm.log 2>&1 &
# внедрить полупрозрачные кнопки (fullscreen/sound + badge by t.me/error_kill) в страницу KasmVNC
cp -f /kasmx.js /usr/share/kasmvnc/www/kasmx.js 2>/dev/null || true
grep -q kasmx.js /usr/share/kasmvnc/www/vnc.html 2>/dev/null || sed -i "s|<body>|<body><script src=kasmx.js></script>|" /usr/share/kasmvnc/www/vnc.html 2>/dev/null || true
for i in $(seq 1 30); do DISPLAY=$D xdpyinfo >/dev/null 2>&1 && break; sleep 1; done
DISPLAY=$D xdpyinfo >/dev/null 2>&1 || { echo KASM-FAIL; tail -20 /tmp/kasm.log; exit 1; }
DISPLAY=$D openbox &>/dev/null & sleep 1
DISPLAY=$D setsid nohup /game/bin/TJPS_OpenGL >/tmp/game.log 2>&1 &
sleep 22
echo "GAME: $(pgrep -af TJPS_OpenGL | head -1)"
echo "WINDOW: $(DISPLAY=$D xdotool search --name \"The Jackbox\" 2>/dev/null | head -1)"
echo "AUDIO: $(pgrep -af ffmpeg | head -1)"
echo CONTAINER-READY
tail -f /dev/null
