FROM ubuntu:noble
RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends \
  xvfb x11vnc xdotool x11-utils openbox libgl1 libgbm1 libx11-6 libxext6 \
  libxfixes3 libxcursor1 libxrandr2 libxshmfence1 libxtst6 zlib1g xauth \
  x11-xkb-utils curl procps ca-certificates perl libswitch-perl libyaml-tiny-perl \
  libhash-merge-simple-perl liblist-moreutils-perl libtry-tiny-perl \
  libdatetime-perl libdatetime-timezone-perl ssl-cert \
  pulseaudio pulseaudio-utils ffmpeg python3 python3-websockets \
  && rm -rf /var/lib/apt/lists/*
RUN curl -sSL -o /tmp/kasm.deb https://github.com/kasmtech/KasmVNC/releases/download/v1.5.0/kasmvncserver_noble_1.5.0_amd64.deb \
  && dpkg -i /tmp/kasm.deb 2>&1 | tail -2 || true \
  && apt-get -y -qq -f install 2>&1 | tail -1 \
  && rm /tmp/kasm.deb \
  && echo pass | kasmvncpasswd -u root -wo 2>/dev/null || true
COPY game /game
COPY kasmx.js /kasmx.js
COPY ws_audio_server.py /opt/ws_audio_server.py
RUN chmod +x /game/bin/TJPS_OpenGL /game/bin/TJPP2_OpenGL 2>/dev/null || true
ENV DISPLAY=:99 GAME=jps XDG_RUNTIME_DIR=/tmp/xdg99
COPY start.sh /start.sh
RUN chmod +x /start.sh
EXPOSE 6911
CMD ["/start.sh"]