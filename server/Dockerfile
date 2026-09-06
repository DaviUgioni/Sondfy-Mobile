# Servidor pessoal yt-dlp para o app Sondfy.
FROM node:20-slim

# ffmpeg (conversão de áudio) + python3 (runtime do yt-dlp) + curl (baixar o binário)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl python3 ffmpeg \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp \
  && apt-get purge -y curl && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY . .

ENV PORT=3000
EXPOSE 3000
CMD ["node", "index.js"]
