# Sondfy Mobile

Player de **músicas locais** para Android (Expo / React Native), com interface
escura inspirada no Spotify. Você traz os áudios que já tem no celular — de
arquivos, de uma pasta, ou compartilhados de outro app — e o Sondfy os organiza,
guarda os nomes e toca **offline**, com notificação de mídia e reprodução em
segundo plano.

Não tem login, catálogo, anúncios nem streaming. **Começa vazio.**

> **Sobre baixar do YouTube:** o app não baixa do YouTube sozinho (exige um
> servidor e contraria os Termos do YouTube). Há dois caminhos opcionais, ambos
> para **uso pessoal**: compartilhar o arquivo de um app como o **NewPipe**, ou
> rodar o **servidor pessoal** da pasta [`server/`](server/README.md). Veja
> [Trazer músicas do YouTube](#trazer-músicas-do-youtube-opcional).

---

## Sumário

- [Como usar o app](#como-usar-o-app)
- [Trazer músicas do YouTube (opcional)](#trazer-músicas-do-youtube-opcional)
- [Telas](#telas)
- [Design system](#design-system)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Stack técnica](#stack-técnica)
- [Rodar o projeto (desenvolvimento)](#rodar-o-projeto-desenvolvimento)
- [Gerar o APK (EAS Build)](#gerar-o-apk-eas-build)
- [Convenções de código](#convenções-de-código)
- [Limitações conhecidas / roadmap](#limitações-conhecidas--roadmap)
- [Licença](#licença)

---

## Como usar o app

### Instalar

Baixe o APK gerado pelo EAS (link no fim de cada build) e instale no Android.
É um app autônomo — não precisa de PC nem de servidor para as funções locais.
Se estiver atualizando de uma versão de desenvolvimento antiga (a que abria numa
tela "Development servers"), **desinstale-a antes**.

### Adicionar músicas

Na aba **Importar**:

| Ação | O que faz |
|---|---|
| **Escolher arquivos** | Abre o seletor do sistema (multi-seleção). Cada arquivo é **copiado para dentro do app** — fica disponível para sempre, mesmo que você mova o original. |
| **Escolher pasta do dispositivo** (Android) | Você concede acesso a uma pasta (Storage Access Framework). O Android **lembra** essa permissão. O Sondfy lê os áudios da pasta e os referencia direto, **sem copiar**. |
| **Compartilhar → Sondfy** (de outro app) | Qualquer app que compartilhe um arquivo de áudio (ex.: NewPipe) manda a faixa direto para a biblioteca. |

Formatos reconhecidos: **MP3, M4A, WAV, AAC, OGG, OPUS, FLAC** (pela extensão real
do arquivo). O nome exibido é o nome do arquivo, sem a extensão.

### Ouvir

- Toque numa faixa em **Músicas** para tocar. O mini player aparece acima da
  barra inferior; toque nele para abrir o player em tela cheia.
- Controles: **anterior · play/pause · próxima · loop** (loop repete a faixa
  atual). A barra de progresso é deslizável.
- O áudio **continua tocando** ao trocar de tela e em segundo plano.
- **Notificação de mídia**: com algo tocando, aparece uma notificação (e controle
  na tela de bloqueio) com o título, play/pause e avanço/retrocesso. Anterior/
  próxima ali não estão disponíveis (limitação da API); use o app para isso.

### Editar e remover

Toque no **`⋯`** de uma faixa (ou **pressione e segure** a linha):

- **Renomear** — muda só o nome exibido; o arquivo no disco não é alterado.
- **Remover** — tira da biblioteca. Se a faixa era uma **cópia do app** (arquivos,
  compartilhados, download), a cópia é **apagada**. Se veio de uma **pasta do
  dispositivo**, o arquivo original **não é tocado**.

Faixas cujo arquivo foi movido/apagado aparecem como **Indisponível** e podem ser
removidas pelo mesmo menu.

### Sem duplicatas

O mesmo arquivo (mesmo **nome + tamanho em bytes**) não entra duas vezes. Se você
reimportar algo que já está na biblioteca, o app avisa "já existia" e não duplica.

### Persistência

Tudo (biblioteca, nomes, tempo ouvido, pasta escolhida, configurações do
servidor) é salvo em `AsyncStorage`. Feche e reabra o app — a biblioteca é
reconstruída, e faixas cujo arquivo sumiu são marcadas como indisponíveis.

---

## Trazer músicas do YouTube (opcional)

Nenhuma opção de YouTube é "sem manutenção": quando o YouTube muda algo, elas
quebram até serem atualizadas. Escolha uma:

### A) NewPipe + Compartilhar (recomendado, sem servidor)

1. Instale o **NewPipe** — [F-Droid](https://f-droid.org/packages/org.schabi.newpipe/)
   ou [newpipe.net](https://newpipe.net). Grátis, open-source, sem anúncios.
2. No NewPipe, abra o vídeo → **baixar** → escolha **áudio** (m4a/opus).
3. Em **Downloads** do NewPipe, toque e segure o arquivo → **Compartilhar** →
   **Sondfy**.
4. O Sondfy importa com o nome certo, pronto para tocar offline.

Robusto porque quem lida com o YouTube é o NewPipe, que é bem mantido.

### B) Servidor pessoal com yt-dlp (download dentro do app)

A pasta [`server/`](server/README.md) tem um serviço Node (Express + **yt-dlp** +
**ffmpeg**). Deploy grátis no Render (`server/render.yaml`) ou rode localmente.
Depois, em **Configurações → Servidor de download**, cole a URL e a `API_KEY`.
A seção "Baixar de um link" na aba Importar passa a funcionar (cola o link →
o servidor baixa → o app salva o MP3/M4A). Detalhes e limites no
[README do servidor](server/README.md).

---

## Telas

Navegação em [`App.tsx`](App.tsx): stack nativa com `Main`, `Settings`,
`FolderPicker` e `Player` (modal). As 3 abas trocam por um
[`BottomNav`](src/components/BottomNav.tsx) próprio.

### 1. Músicas — [`src/screens/tabs/HomeTab.tsx`](src/screens/tabs/HomeTab.tsx)
Lista da biblioteca, mais recente no topo. Cada item: capa/placeholder, selo de
offline, duração, tag de formato, tamanho. Barras de equalizador na faixa em
reprodução. Botão `⋯` / long-press para editar/remover. Estado vazio com atalho
para Importar. Mini player fixo acima da barra inferior.

### 2. Estatísticas — [`src/screens/tabs/StatsTab.tsx`](src/screens/tabs/StatsTab.tsx)
Três cards: tempo total ouvido, música mais repetida, quantidade de músicas.
Tudo do uso real; app vazio mostra zeros.

### 3. Importar — [`src/screens/tabs/ImportTab.tsx`](src/screens/tabs/ImportTab.tsx)
Baixar de um link (via servidor pessoal, se configurado) · Escolher arquivos ·
Escolher pasta do dispositivo (Android). Feedback de status e contagem da
biblioteca.

### Player em tela cheia — [`src/screens/PlayerScreen.tsx`](src/screens/PlayerScreen.tsx)
Capa grande, título, metadados, [`SeekBar`](src/components/SeekBar.tsx) deslizável
(`PanResponder`), controles Anterior · Play/Pause · Próximo · Loop.

### Configurações — [`src/screens/SettingsScreen.tsx`](src/screens/SettingsScreen.tsx)
Pasta no dispositivo ([`FolderPickerScreen`](src/screens/FolderPickerScreen.tsx)) ·
Formato preferido (MP3 / M4A / FLAC) · **Servidor de download** (URL + chave) ·
Versão.

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
- **Tipografia** (`typography`): fonte do sistema, títulos grandes em negrito.
- **Degradês** simulados com faixas de opacidade ([`GradientBackground`](src/components/GradientBackground.tsx)) — sem `expo-linear-gradient`.
- **Ícones** desenhados só com `View` ([`src/components/Icon.tsx`](src/components/Icon.tsx)) — sem `@expo/vector-icons` nem `react-native-svg`.
- **Ícone do app**: [`assets/sondfy-icon.png`](assets/sondfy-icon.png) (iOS/legado) e [`assets/sondfy-icon-adaptive.png`](assets/sondfy-icon-adaptive.png) (adaptive icon do Android, com margem para não cortar), sobre `#1ED760`.

---

## Arquitetura

Estado global via **3 React Contexts**, aninhados em `App.tsx` dentro de um
`ShareIntentProvider`:

```
<ShareIntentProvider>            ← recebe arquivos de "Compartilhar"
  <SettingsProvider>            ← pasta, formato, servidor de download   (AsyncStorage)
    <LibraryProvider>           ← faixas, tempo ouvido, importação, dedup (AsyncStorage)
      <ShareIntentBridge/>      ← importa o que chegou via compartilhar
      <PlayerProvider>          ← faixa atual, play/pause/stop, loop, seek, notificação
        <NavigationContainer> …
```

| Context | Arquivo | Responsabilidade |
|---|---|---|
| `SettingsContext` | [`src/settings/SettingsContext.tsx`](src/settings/SettingsContext.tsx) | `folder`, `defaultFormat`, `downloadServerUrl`, `downloadServerKey`. Persistido. |
| `LibraryContext` | [`src/library/LibraryContext.tsx`](src/library/LibraryContext.tsx) | `downloads`, `importFiles` / `importFolder` / `importFromLink` / `importSharedFiles`, `renameTrack`, `removeDownload`, `refreshAvailability`, `updateTrackDuration`, `stats`. Persistido. |
| `PlayerContext` | [`src/player/PlayerContext.tsx`](src/player/PlayerContext.tsx) | `track`, `playing`, `looping`, `progress`, `elapsedSec`, `durationSec`, `playTrack`, `togglePlay`, `toggleLoop`, `stop`, `dismiss`, `next`, `previous`, `seek`. Backed por `expo-audio`. |

- **Reprodução real** com `expo-audio` (`createAudioPlayer`): uma instância única
  no provider, viva enquanto o app estiver aberto; `setAudioModeAsync` com
  background playback e `interruptionMode: 'doNotMix'`.
- **Notificação de mídia** via `setActiveForLockScreen` / `updateLockScreenMetadata`
  / `clearLockScreenControls`.
- **Persistência** por [`src/storage/persist.ts`](src/storage/persist.ts) (uma
  camada só sobre `AsyncStorage`; tolerante a falha).
- **Importação e download** em [`src/library/importAudio.ts`](src/library/importAudio.ts):
  `expo-document-picker`, `StorageAccessFramework` (`expo-file-system/legacy`),
  cópia para `documentDirectory/music/`, `downloadFromServer`, dedup por
  `nome + bytes`, e limpeza da cópia ao remover (só arquivos do app).

### Tipo principal

```ts
type DownloadedTrack = {
  id: string;                 // = uri (estável, evita duplicar)
  title: string;              // nome exibido (editável); vem do nome do arquivo
  uri: string;                // file:// (cópia no app) ou content:// (pasta SAF)
  fileName?: string;          // nome real do arquivo com extensão
  origin: 'file' | 'folder' | 'youtube';
  folderPath: string;         // origem legível
  durationSec: number;        // 0 até a 1ª reprodução; depois o valor real
  format: string;             // MP3 | M4A | WAV | AAC | OGG | OPUS | FLAC
  sizeMB: number;
  sizeBytes?: number;
  dedupKey?: string;          // `${fileName}|${sizeBytes}` — anti-duplicata
  addedAt: number;
  playCount: number;
  missing?: boolean;          // arquivo não está mais acessível
  thumbnailUrl?: string;      // legado
};
```

---

## Estrutura de pastas

```
App.tsx                      Providers + stack de navegação
index.ts                     Entry point do Expo
app.json                     Config Expo (ícone, nome, plugins, permissões)
eas.json                     Perfis de build (development / preview / production)
server/                      Servidor pessoal opcional (yt-dlp + ffmpeg)
src/
├─ theme.ts                  Tokens de design
├─ settings/SettingsContext.tsx   Pasta, formato, servidor de download (persistido)
├─ library/
│  ├─ LibraryContext.tsx     Biblioteca, importação, dedup, editar/remover (persistido)
│  └─ importAudio.ts         Seletores, SAF, cópia, download por servidor, dedup
├─ player/PlayerContext.tsx  Reprodução real (expo-audio) + notificação de mídia
├─ storage/persist.ts        Camada única sobre AsyncStorage
├─ share/ShareIntentBridge.tsx    Recebe "Compartilhar → Sondfy" e importa
├─ screens/
│  ├─ MainScreen.tsx         Casca: aba ativa + dock (mini player + bottom bar)
│  ├─ PlayerScreen.tsx       Player em tela cheia (rota modal)
│  ├─ SettingsScreen.tsx     Configurações
│  ├─ FolderPickerScreen.tsx Escolha de pasta / arquivos / reverificar
│  └─ tabs/
│     ├─ HomeTab.tsx         Músicas (+ editar/remover)
│     ├─ StatsTab.tsx        Estatísticas
│     └─ ImportTab.tsx       Importar (link / arquivos / pasta)
├─ components/
│  ├─ BottomNav.tsx · MiniPlayer.tsx · SeekBar.tsx · CoverArt.tsx
│  ├─ EqualizerBars.tsx · QualityTag.tsx · EmptyState.tsx
│  ├─ GradientBackground.tsx · PressableScale.tsx
│  ├─ TrackEditModal.tsx     Modal de renomear / remover
│  └─ Icon.tsx               Todos os ícones (View)
└─ utils/
   ├─ time.ts                formatTime, formatLongDuration
   ├─ audioFile.ts           extensão, formato, nome real, nome seguro
   ├─ color.ts               hexToRgb, rgba, darken
   └─ youtube.ts             parseYouTubeId (legado, não usado nas telas)
```

---

## Stack técnica

| Item | Versão |
|---|---|
| Expo SDK | ~57 |
| React Native | 0.86 |
| React | 19.2 |
| TypeScript | ~6.0 (`strict`) |
| Navegação | `@react-navigation/native` + `native-stack` v7 |
| Áudio | `expo-audio` |
| Arquivos | `expo-file-system` (+ `/legacy` para SAF), `expo-document-picker` |
| Compartilhar | `expo-share-intent` |
| Persistência | `@react-native-async-storage/async-storage` |

`expo-audio`, `expo-share-intent` e o SAF exigem um **dev client / build EAS** —
não rodam no Expo Go.

---

## Rodar o projeto (desenvolvimento)

### Pré-requisitos
- **Node.js 18+** (testado com 24.x)
- Conta no [Expo](https://expo.dev) para builds EAS
- Um dispositivo Android (o app é focado em Android)

### Instalar

```bash
git clone https://github.com/DaviUgioni/Sondfy-Mobile.git
cd Sondfy-Mobile
npm install
```

### Rodar com dev client

Como o app usa módulos nativos (`expo-audio`, `expo-share-intent`), você precisa
de um **development build** instalado no aparelho (uma vez):

```bash
npx eas-cli build --profile development --platform android
# instale o APK gerado, depois:
npx expo start --dev-client
```

### Checagens

```bash
npx tsc --noEmit
npx expo config --type introspect      # valida plugins/permissões
npx expo export --platform android --output-dir dist   # sanity do bundle
```

---

## Gerar o APK (EAS Build)

Perfis em [`eas.json`](eas.json):

| Perfil | Comando | Resultado |
|---|---|---|
| `preview` | `npx eas-cli build --profile preview --platform android` | **APK autônomo** — instala e usa, sem PC. É o que você distribui para si mesmo. |
| `development` | `npx eas-cli build --profile development --platform android` | APK com dev client — precisa do `expo start --dev-client` rodando. Para desenvolver. |
| `production` | `npx eas-cli build --profile production --platform android` | App Bundle (`.aab`). |

Em CI / sem login interativo, use `EXPO_TOKEN` (crie em
expo.dev → Settings → Access Tokens):

```bash
EXPO_TOKEN=xxxx npx eas-cli build --profile preview --platform android --non-interactive
```

---

## Convenções de código

- **TypeScript `strict`**; sem `any` implícito.
- Telas em `src/screens`, reutilizáveis em `src/components`.
- Estilos com `StyleSheet.create` lendo os tokens de `src/theme.ts` (nada de hex solto).
- Comentários e textos de UI em **português**.
- Cada `Context` expõe um hook `useX()` que lança erro fora do provider.
- Ícones novos em `src/components/Icon.tsx`, padrão `active` (linha → preenchido).
- Toda I/O de arquivo/rede é tolerante a falha — nunca derruba a UI.

---

## Limitações conhecidas / roadmap

| Área | Situação atual | Próximo passo |
|---|---|---|
| **Reprodução de áudio** | Real, via `expo-audio` (`play/pause/parar/seek/loop`, segue tocando ao trocar de tela, background playback). | — |
| **Notificação de mídia** | Notificação/tela de bloqueio com título, play/pause e seek. | Botões de anterior/próxima (a API de player único do `expo-audio` não expõe). |
| **Importação** | `expo-document-picker` (arquivos, copiados) e SAF (pasta, Android, referenciada). | Varredura recursiva de subpastas. |
| **Trazer do YouTube** | Compartilhar → Sondfy (via NewPipe) ou servidor pessoal com yt-dlp ([`server/`](server/README.md)). | — |
| **Persistência** | `AsyncStorage` (`src/storage/persist.ts`). | — |
| **Editar / remover** | Renomear e remover pelo menu da faixa. Remover apaga só cópias do app. | — |
| **Sem duplicatas** | Dedup por `nome + tamanho em bytes`. | Hash de conteúdo (md5) para pegar renomeados. |
| **Arquivo indisponível** | Detectado no boot e antes de tocar; marcado e removível. | — |
| **Formatos** | MP3, M4A, WAV, AAC, OGG, OPUS, FLAC (pela extensão). | Metadados ID3 (capa, artista). |
| **iOS** | Não é o foco; SAF e o share-intent estão configurados só para Android. | Suporte iOS completo. |
| **Testes** | Sem testes automatizados. | Jest + RN Testing Library nos contextos e utils. |

---

## Licença

MIT — veja [`LICENSE`](LICENSE).
