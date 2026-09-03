FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip ffmpeg \
  && pip3 install --no-cache-dir --break-system-packages yt-dlp \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
COPY index.html script.js styles.css site.webmanifest ./
COPY favicon.svg ./
COPY server.js README.md ./

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

CMD ["node", "server.js"]
