# Sondfy Mobile

Aplicativo mobile (Expo / React Native) para **importar e ouvir músicas locais do celular offline**, com uma interface escura inspirada no Spotify.

O app é organizado em **3 telas**: a lista das músicas da biblioteca, um resumo de estatísticas de uso e uma tela de _importação_ (escolher arquivos ou uma pasta do dispositivo). Há ainda um **player em tela cheia** e um **mini player flutuante**.

> **Estado atual:** biblioteca musical local funcional. A reprodução usa `expo-audio` (áudio real), a importação usa `expo-document-picker` + Storage Access Framework (`expo-file-system`), e a persistência usa `AsyncStorage`. A antiga aba _Downloader_ do YouTube (que era só simulada, sem baixar nada de fato) foi substituída pela aba **Importar**, já que baixar do YouTube exige um servidor e não é 100% gratuito/offline.

---

## Sumário

- [Conceito](#conceito)
- [Design system](#design-system)
- [Telas](#telas)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Stack técnica](#stack-técnica)
- [Como rodar](#como-rodar)
- [Ciclo de um download](#ciclo-de-um-download)
- [Convenções de código](#convenções-de-código)
- [Limitações conhecidas / roadmap](#limitações-conhecidas--roadmap)
- [Licença](#licença)

---

## Conceito

1. O usuário cola um **link do YouTube** na aba _Downloader_.
2. O app resolve o vídeo, baixa o áudio no formato escolhido e salva na **pasta do dispositivo** definida em Configurações.
3. A faixa passa a aparecer na tela **Músicas** (mais recente sempre no topo) e pode ser tocada no mini player ou no player em tela cheia, com **loop** por faixa.
4. A aba **Estatísticas** resume o uso: tempo total ouvido, faixa mais repetida e quantidade de músicas baixadas.

Não há login, biblioteca com playlists, busca ou catálogo — só os arquivos que o próprio usuário baixou. **O app inicia vazio: não há nenhum dado fictício.**

---

## Design system

Tokens centralizados em [`src/theme.ts`](src/theme.ts).

| Token | Valor | Uso |
|---|---|---|
| `colors.bg` | `#121212` | Fundo predominante |
| `colors.bgGradientTop` | `#1F1F1F` | Tint do degradê que desce do topo |
| `colors.card` | `#181818` | Cards e módulos |
| `colors.surface` | `#2A2A2A` | Inputs, trilhas de progresso |
| `colors.placeholder` | `#282828` | Capa ausente (nota musical) |
| `colors.primary` | `#1DB954` | Ações principais e estados ativos |
| `colors.text` / `textMuted` / `textFaint` | `#FFFFFF` / `#B3B3B3` / `#727272` | Hierarquia de texto e ícones |
| `colors.bottomBar` | `rgba(18,18,18,0.96)` | Barra de navegação translúcida |

- **Espaçamento** (`spacing`): escala de `4` a `32`.
- **Raio** (`radius`): `thumb 4` (capas), `card 8` (módulos), `pill` / `round`.
- **Tipografia** (`typography`): fonte do sistema (geométrica), títulos grandes em negrito, descrições pequenas em cinza.
- **Degradês** são simulados com faixas de opacidade decrescente ([`GradientBackground`](src/components/GradientBackground.tsx)) — sem `expo-linear-gradient`.
- **Ícones** são desenhados apenas com `View` ([`src/components/Icon.tsx`](src/components/Icon.tsx)) — sem `@expo/vector-icons` nem `react-native-svg`. Linha fina quando inativos, preenchidos quando ativos.

---

## Telas

Navegação em [`App.tsx`](App.tsx): stack nativa com `Main`, `Settings`, `FolderPicker` e `Player` (apresentação modal). A troca entre as 3 abas é feita por um [`BottomNav`](src/components/BottomNav.tsx) próprio (não usa `@react-navigation/bottom-tabs`).

### 1. Músicas — [`src/screens/tabs/HomeTab.tsx`](src/screens/tabs/HomeTab.tsx)
- Lista direta dos arquivos de áudio locais baixados.
- Cada item: capa (thumbnail do vídeo, ou placeholder), selo verde de "offline", duração, tag de formato e tamanho.
- **Mais recente sempre no topo**; a lista rola automaticamente para o topo quando um novo download termina.
- Barras de equalizador animadas na faixa em reprodução.
- Estado vazio com atalho para o _Downloader_.
- Mini player flutuante fixo acima da bottom bar.

### 2. Estatísticas — [`src/screens/tabs/StatsTab.tsx`](src/screens/tabs/StatsTab.tsx)
Exatamente 3 cards (verde e preto):
1. **Tempo total ouvido** — acumulado enquanto o player toca.
2. **Música mais repetida** — faixa com maior contagem de reproduções.
3. **Quantidade de músicas baixadas** no dispositivo.

Tudo derivado do uso real; com o app vazio mostra zeros.

### 3. Downloader — [`src/screens/tabs/DownloaderTab.tsx`](src/screens/tabs/DownloaderTab.tsx)
- Campo para o **link do YouTube**.
- Botão **Baixar**.
- **Barra de progresso** com os estados: `Processando link…` → `Baixando… NN%` → `Concluído` (verde) / `Link inválido` (vermelho).
- O formato do arquivo vem do **formato padrão** definido em Configurações.

### Player em tela cheia — [`src/screens/PlayerScreen.tsx`](src/screens/PlayerScreen.tsx)
- Abre ao tocar no mini player.
- Capa grande, título, metadados e degradê escuro.
- **Barra de progresso deslizável** ([`SeekBar`](src/components/SeekBar.tsx)): tocar salta para o ponto; arrastar o indicador move para qualquer posição (implementado com `PanResponder`).
- **Controles**: Anterior · Play/Pause (verde, central) · Próximo · Loop. Anterior/Próximo percorrem a lista de faixas baixadas (Anterior reinicia a faixa se já passou de 3 s).

### Configurações — [`src/screens/SettingsScreen.tsx`](src/screens/SettingsScreen.tsx)
- **Pasta no dispositivo** → abre o [`FolderPickerScreen`](src/screens/FolderPickerScreen.tsx) para escolher entre pastas comuns do Android (Sondfy, Music, Download, Podcasts, WhatsApp Audio).
- **Formato padrão do download**: `MP3` / `M4A` / `FLAC`.
- Versão do app.

---

## Arquitetura

Estado global via **3 React Contexts**, aninhados nesta ordem em `App.tsx`:

```
<SettingsProvider>      ← pasta do dispositivo + formato padrão
  <LibraryProvider>     ← faixas baixadas, tempo ouvido, contagem de plays
    <PlayerProvider>    ← faixa atual, play/pause, loop, seek, next/previous
      <NavigationContainer> …
```

| Context | Arquivo | Responsabilidade |
|---|---|---|
| `SettingsContext` | [`src/settings/SettingsContext.tsx`](src/settings/SettingsContext.tsx) | `folder`, `setFolder`, `defaultFormat`, `setDefaultFormat`. Lista `DEVICE_FOLDERS`. |
| `LibraryContext` | [`src/library/LibraryContext.tsx`](src/library/LibraryContext.tsx) | `downloads: DownloadedTrack[]`, `addDownload`, `registerPlay`, `addListenedSeconds`, `removeDownload`, `stats`. |
| `PlayerContext` | [`src/player/PlayerContext.tsx`](src/player/PlayerContext.tsx) | `track`, `playing`, `looping`, `progress`, `elapsedSec`, `playTrack`, `togglePlay`, `toggleLoop`, `next`, `previous`, `seek`. |

`PlayerContext` consome `LibraryContext` (para registrar plays / tempo ouvido e navegar entre faixas). A linha do tempo do player avança com um `setInterval` de 1 s enquanto `playing` é verdadeiro.

**Sem persistência:** todo o estado vive em memória e é perdido ao fechar o app.

### Tipo principal

```ts
type DownloadedTrack = {
  id: string;
  title: string;         // derivado do id do vídeo do link
  sourceUrl: string;
  thumbnailUrl?: string; // https://i.ytimg.com/vi/<id>/hqdefault.jpg
  folderPath: string;    // pasta escolhida em Configurações
  durationSec: number;
  format: string;        // MP3 | M4A | FLAC
  sizeMB: number;
  addedAt: number;
  playCount: number;
};
```

---

## Estrutura de pastas

```
App.tsx                     Providers + stack de navegação
index.ts                    Entry point do Expo
src/
├─ theme.ts                 Tokens: cores, spacing, radius, tipografia, layout
├─ settings/
│  └─ SettingsContext.tsx   Pasta do dispositivo + formato padrão
├─ library/
│  └─ LibraryContext.tsx    Faixas baixadas + métricas
├─ player/
│  └─ PlayerContext.tsx     Estado de reprodução
├─ screens/
│  ├─ MainScreen.tsx        Casca: header + aba ativa + dock (mini player + bottom bar)
│  ├─ PlayerScreen.tsx      Player em tela cheia (rota modal)
│  ├─ SettingsScreen.tsx    Configurações
│  ├─ FolderPickerScreen.tsx Seleção da pasta do dispositivo
│  └─ tabs/
│     ├─ HomeTab.tsx        Tela 1 — Músicas
│     ├─ StatsTab.tsx       Tela 2 — Estatísticas
│     └─ DownloaderTab.tsx  Tela 3 — Downloader
├─ components/
│  ├─ BottomNav.tsx         Barra de navegação inferior (3 abas)
│  ├─ MiniPlayer.tsx        Mini player flutuante
│  ├─ SeekBar.tsx           Barra de progresso deslizável (PanResponder)
│  ├─ CoverArt.tsx          Capa com fallback para placeholder de nota musical
│  ├─ EqualizerBars.tsx     Barras de equalizador animadas
│  ├─ QualityTag.tsx        Tag de formato (MP3/M4A/FLAC)
│  ├─ EmptyState.tsx        Estado vazio com ilustração minimalista
│  ├─ GradientBackground.tsx Degradê simulado (sem libs nativas)
│  ├─ PressableScale.tsx    Feedback de toque com escala (helper, ainda não usado)
│  └─ Icon.tsx              Todos os ícones, desenhados com View
└─ utils/
   ├─ time.ts               parseDuration, formatTime, formatLongDuration
   ├─ color.ts              hexToRgb, rgba, darken
   └─ youtube.ts            parseYouTubeId, youTubeThumbnail
```

---

## Stack técnica

| Item | Versão |
|---|---|
| Expo SDK | ~57 |
| React Native | 0.86.2 |
| React | 19.2.3 |
| TypeScript | ~6.0 (`strict`) |
| Navegação | `@react-navigation/native` + `@react-navigation/native-stack` v7 |

**Sem dependências nativas extras.** Ícones, degradês e a barra de _seek_ são feitos com primitivos do React Native (`View`, `Animated`, `PanResponder`). Não há `@expo/vector-icons`, `expo-linear-gradient`, `react-native-svg`, `@react-native-community/slider` nem `@react-navigation/bottom-tabs`.

---

## Como rodar

### Pré-requisitos
- **Node.js 18+** (testado com 24.x)
- **Expo Go** no celular _ou_ um emulador Android / simulador iOS
- Não é necessário instalar a CLI do Expo globalmente (`npx expo` é usado via `package.json`)

### Instalação

```bash
git clone https://github.com/DaviUgioni/Sondfy-Mobile.git
cd Sondfy-Mobile
npm install
```

### Scripts

```bash
npm start          # inicia o Metro bundler (QR code para o Expo Go)
npm run android    # abre no emulador/dispositivo Android
npm run ios        # abre no simulador iOS (somente macOS)
npm run web        # abre no navegador
```

### Checagem de tipos

```bash
npx tsc --noEmit
```

### Gerar bundle de produção (sanity check)

```bash
npx expo export --platform android --output-dir dist
```

---

## Ciclo de um download

Passo a passo do que acontece hoje (com a etapa de extração **simulada**):

1. **Downloader** — o usuário cola o link e toca em _Baixar_.
2. `parseYouTubeId()` extrai o id do vídeo. Se não reconhecer → card de progresso em estado `Link inválido`.
3. Estado `Processando link…` por ~1 s (representa a resolução de metadados que um backend faria).
4. Estado `Baixando… NN%` — a porcentagem sobe em intervalos até 100%.
5. Ao concluir, `LibraryContext.addDownload()` cria um `DownloadedTrack` com:
   - `title` derivado do id do vídeo,
   - `thumbnailUrl` = `https://i.ytimg.com/vi/<id>/hqdefault.jpg`,
   - `folderPath` = pasta atual das Configurações,
   - `format` = formato padrão,
   - `durationSec` / `sizeMB` estimados.
6. A faixa aparece **no topo** da tela _Músicas_ e entra nas _Estatísticas_.
7. Ao tocar a faixa: `PlayerContext.playTrack()` incrementa `playCount` e inicia a linha do tempo; enquanto toca, `addListenedSeconds()` acumula o tempo total ouvido.

---

## Convenções de código

- **TypeScript `strict`**; sem `any` implícito.
- Componentes de tela em `src/screens`, reutilizáveis em `src/components`.
- Estilos com `StyleSheet.create`, sempre lendo os tokens de `src/theme.ts` (nada de hex solto).
- Comentários e textos de UI em **português**.
- Cada `Context` expõe um hook `useX()` que lança erro se usado fora do provider.
- Ícones novos entram em `src/components/Icon.tsx` seguindo o padrão `active` (linha → preenchido).

---

## Limitações conhecidas / roadmap

| Área | Situação atual | Próximo passo |
|---|---|---|
| **Reprodução de áudio** | Real, via `expo-audio` (`play/pause/parar/seek/loop`, segue tocando ao trocar de tela, background playback). | — |
| **Importação** | Real: `expo-document-picker` (arquivos, copiados para o app) e Storage Access Framework via `expo-file-system` (pasta, Android). | Varredura recursiva de subpastas. |
| **Persistência** | `AsyncStorage` (`src/storage/persist.ts`): biblioteca, tempo ouvido e pasta escolhida sobrevivem ao fechar/abrir o app. | — |
| **Arquivo indisponível** | Detectado no boot e antes de tocar (`refreshAvailability`); item marcado como _Indisponível_ e não quebra o app. | — |
| **Formatos** | MP3, M4A, WAV, AAC, OGG, OPUS, FLAC (detecção por extensão real). | Metadados ID3 (capa, artista). |
| **Trazer músicas de outros apps** | **Compartilhar → Sondfy**: qualquer app que compartilhe um arquivo de áudio (ex.: **NewPipe**) manda direto para a biblioteca (via `expo-share-intent`). Robusto — quem lida com o YouTube é o outro app. | — |
| **Download por link dentro do app** | Opcional, via **servidor pessoal** com yt-dlp (pasta [`server/`](server/README.md)). Configure a URL em Configurações → Servidor de download. Sem servidor, a seção fica escondida. | Frágil: quando o YouTube muda algo, refaça o deploy do servidor. |
| **Testes** | Sem testes automatizados. | Jest + React Native Testing Library nos contextos e utils. |
| **Web** | SAF não existe na web; use "Escolher arquivos". | Refino responsivo se a web for um alvo. |

---

## Servidor de download (opcional)

A pasta [`server/`](server/README.md) tem um serviço pequeno em Node que usa
**yt-dlp** + **ffmpeg** para baixar o áudio de um link e devolver o arquivo ao app.
É de **uso pessoal** (baixar do YouTube contraria os Termos deles). Deploy grátis
no Render via `server/render.yaml`, ou rode localmente com `npm start`. Depois é só
colar a URL e a `API_KEY` em **Configurações → Servidor de download**.

---

## Licença

MIT — veja [`LICENSE`](LICENSE).
