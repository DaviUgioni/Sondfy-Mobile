# Sondfy — servidor pessoal de download (yt-dlp)

Pequeno serviço HTTP que usa **yt-dlp** + **ffmpeg** para baixar o áudio de um
link (YouTube e centenas de outros sites) e devolver o arquivo para o app Sondfy.

> **Uso pessoal.** Baixar do YouTube contraria os Termos de Serviço deles. Rode
> para o seu próprio uso e proteja com `API_KEY`. Não distribua o endpoint.
> Quando o YouTube mudar algo e parar de funcionar, faça um novo deploy
> (o build baixa a versão mais recente do yt-dlp) ou rode `yt-dlp -U` localmente.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | responde `ok` |
| GET | `/info?url=<link>&key=<API_KEY>` | JSON `{ title, durationSec, uploader, ext }` |
| GET | `/download?url=<link>&key=<API_KEY>&format=m4a\|mp3` | devolve o arquivo de áudio; cabeçalhos `X-Video-Title`, `X-Audio-Ext`, `X-Video-Duration` |

## Rodar localmente (na sua máquina)

Pré-requisitos: **Node 18+**, **yt-dlp** e **ffmpeg** no `PATH`.

```bash
cd server
npm install
API_KEY=umsegredoqualquer npm start
# servidor em http://localhost:3000
```

No app (Configurações → Servidor de download), use `http://<ip-da-sua-máquina-na-rede>:3000`
e a mesma `API_KEY`. Celular e PC precisam estar na mesma rede Wi-Fi.

Teste rápido:
```bash
curl "http://localhost:3000/info?url=https://youtu.be/dQw4w9WgXcQ&key=umsegredoqualquer"
```

## Deploy grátis no Render

1. Suba este repositório no GitHub (já está).
2. Em https://render.com → **New +** → **Blueprint** → escolha o repo. O Render lê
   `server/render.yaml`, cria o serviço Docker no plano **free** e gera um `API_KEY`.
3. Em **Environment**, copie o valor de `API_KEY`.
4. Quando o deploy terminar, a URL é algo como `https://sondfy-ytdl.onrender.com`.
5. No app → **Configurações → Servidor de download**: cole a URL e a `API_KEY`.

**Limitações do plano free do Render:** o serviço "dorme" após ~15 min sem uso;
a primeira requisição depois disso leva ~1 min para responder (o app espera).
IPs de datacenter às vezes são bloqueados pelo YouTube — se acontecer, veja
`YTDLP_COOKIES` e `YTDLP_EXTRA_ARGS` abaixo.

## Variáveis de ambiente

| Variável | Default | Uso |
|---|---|---|
| `PORT` | `3000` | porta HTTP |
| `API_KEY` | — | se definida, exigida em `?key=` (recomendado) |
| `MAX_CONCURRENT` | `2` | downloads simultâneos |
| `MAX_DURATION_SEC` | `5400` | duração máxima aceita (90 min) |
| `YTDLP_BIN` | `yt-dlp` | caminho do binário |
| `YTDLP_COOKIES` | — | conteúdo de um `cookies.txt` do navegador; ajuda quando o YouTube bloqueia o IP do servidor |
| `YTDLP_EXTRA_ARGS` | — | args extras, ex.: `--extractor-args "youtube:player_client=android"` |

## Outros hosts

Qualquer lugar que rode Docker serve: Fly.io, Railway, uma VM free da Oracle
Cloud, um Raspberry Pi na sua casa, etc. Use o `Dockerfile` desta pasta.
