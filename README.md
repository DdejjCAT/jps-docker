# jps-docker — Jackbox Party Starter в портативном Docker

Всё в одном контейнере: X-дисплей (KasmVNC) + игра TJPS_OpenGL. Свои библиотеки, свой дисплей :99 в изоляции.

## Запуск на любом сервере
docker run -d --name jps -p 6911:6911 ghcr.io/DdejjCAT/jps-docker/jps-portable:latest
Открой: http://server:6911/vnc.html

## Для офлайн сервера
docker pull ghcr.io/DdejjCAT/jps-docker/jps-portable:latest
docker save ghcr.io/DdejjCAT/jps-docker/jps-portable:latest -o jps-portable.tar
# на офлайн-сервере:
docker load -i jps-portable.tar
docker run -d --name jps -p 6911:6911 jps-portable

## Что внутри
- Ubuntu 24.04, KasmVNC v1.5.0 как X-дисплей :99, websocket 6911
- Игра /game/bin/TJPS_OpenGL, либы /game/bin/lib (SDL2.30.6/fmod/steam_api)
- openbox, xdotool; логи docker logs jps
