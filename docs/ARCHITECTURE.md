# Architecture

## Vue d'ensemble

Le projet sépare strictement trois couches :

| Couche        | Dossier           | Dépendances navigateur ? | Testable en Vitest pur |
| ------------- | ----------------- | ------------------------ | ---------------------- |
| Analyse DSP   | `src/analysis/`   | Non                      | Oui                    |
| Capture audio | `src/audio/`      | Oui (Web Audio API)      | Indirectement          |
| UI React      | `src/components/` | Oui                      | jsdom                  |

L'orchestration vit dans le hook
[`src/hooks/useTonality.ts`](../src/hooks/useTonality.ts), qui colle les trois
couches ensemble et fait tourner **trois fenêtres glissantes** depuis le même
flux de chromas instantanés.

> Pour le détail mathématique de chaque étape (formules de chroma, Krumhansl,
> templates d'accord, softmax), voir le [README](../README.md#fondations-mathématiques).

## Pipeline pas-à-pas

### 1. Capture (`audio/micStream.ts`)

`getUserMedia` est appelé avec **toutes** les contraintes de traitement audio
désactivées (`echoCancellation`, `noiseSuppression`, `autoGainControl`). Ces
filtres modifient le spectre de manière non-linéaire et faussent l'analyse.

Le `MediaStream` est connecté à un `AudioContext` (taux d'échantillonnage natif
du navigateur, typiquement 44 100 ou 48 000 Hz).

### 2. AnalyserNode (`audio/analyser.ts`)

- `fftSize = 16384` → résolution fréquentielle ≈ 2,9 Hz à 48 kHz.
- `smoothingTimeConstant = 0` → pas de lissage interne ; on fait nos propres
  moyennes plus tard.
- Sortie : `getFloatFrequencyData(buf)` → spectre **en dB** dans `[minDecibels,
maxDecibels]` (par défaut `[-100, -10]`).

### 3. dB → magnitude linéaire (`analysis/chroma.ts`)

`magnitude = 10^(dB / 20)`, avec un seuil plancher à `-90 dB`.

### 4. Spectre → chroma (`analysis/chroma.ts`)

Repli de chaque bin FFT dans sa classe de hauteur ; énergie sommée, puis
L1-normalisée. Bande par défaut `[55 Hz, 5 000 Hz]`.

### 5. Trois fenêtres glissantes en parallèle (`analysis/windowing.ts`)

Le hook maintient **trois** `ChromaWindow` indépendantes. À chaque frame
(10 Hz), le même chroma instantané est `push()`ed dans les trois buffers.

| Fenêtre        | $T$  | $N = T \cdot 10$ | Estimateur         | Cadence visuelle utile |
| -------------- | ---- | ---------------- | ------------------ | ---------------------- |
| chord          | 1 s  | 10 frames        | `detectChord()`    | ~1 Hz visible          |
| shortKey (8 s) | 8 s  | 80 frames        | `detectMajorKey()` | ~0.5 Hz visible        |
| longKey (30 s) | 30 s | 300 frames       | `detectMajorKey()` | très stable            |

### 6. Détection de tonalité (`analysis/keyDetection.ts`)

**24 corrélations** Pearson : 12 contre les profils Krumhansl-Schmuckler
**majeurs** rotés + 12 contre les profils **mineurs** rotés. Softmax conjoint
sur les 24 scores à $\tau = 0.1$. Identique pour les deux fenêtres de tonalité.

Le `detectMajorKey` historique est conservé comme wrapper : il filtre les
12 majeurs et re-normalise les probabilités à 1, pour les callers qui ne
veulent que les majeurs.

### 7. Détection d'accord (`analysis/chordDetection.ts`)

24 templates binaires (12 maj + 12 min), similarité cosinus, softmax à
$\tau = 0.1$.

### 8. Affichage (`components/`)

- `ChromaView` : barres verticales 12-canaux. Une instance par chroma
  (instantané, 1 s, 8 s, 30 s).
- `KeyProbabilities` : top-1 + liste des 12 tonalités. Deux instances (8 s et
  30 s).
- `ChordView` : top-1 + liste tronquée des accords les plus probables.

## Diagramme

```
┌──────────────────┐
│  Microphone      │
└────────┬─────────┘
         │ MediaStream
         ▼
┌──────────────────┐
│  AudioContext    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  AnalyserNode    │  fftSize 16384, smoothing 0
└────────┬─────────┘
         │ getFloatFrequencyData (dB, length 8192)
         ▼
┌──────────────────┐
│ dbSpectrumToMag  │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ spectrumToChroma │  8192 bins → 12-D chroma (instantané)
└────────┬─────────┘
         │  (10 Hz)
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
┌──────────────────┐                    ┌──────────────────┐
│ ChromaWindow 1s  │                    │ ChromaWindow 8s  │
└────────┬─────────┘                    └────────┬─────────┘
         │ aggregate                             │ aggregate
         ▼                                       ▼
┌──────────────────┐                    ┌──────────────────┐
│  detectChord()   │                    │  detectKey()     │
│  24 templates    │                    │ 24 keys (Pearson)│
│  cosinus + softmx│                    │ maj+min + softmax│
└──────────────────┘                    └──────────────────┘
         │                                       │
         └──────────────┐         ┌──────────────┘
                        ▼         ▼
                ┌──────────────────────┐
                │ ChromaWindow 30s     │ ───► detectKey()
                └──────────────────────┘       (idem, plus stable)
```

## Choix de paramètres

| Paramètre               | Valeur    | Justification                                                |
| ----------------------- | --------- | ------------------------------------------------------------ |
| `fftSize`               | 16384     | ~2,9 Hz/bin à 48 kHz → résout les demi-tons dès le bas grave |
| `framesPerSecond`       | 10        | Compromis latence / charge CPU                               |
| `chordWindowSeconds`    | 1         | Granularité musicale typique d'un accord en pop/rock         |
| `shortKeyWindow…`       | 8         | Fenêtre réactive aux modulations                             |
| `longKeyWindow…`        | 30        | Fenêtre stable, donne la tonalité globale                    |
| `minFreq / maxFreq`     | 55 / 5000 | Couvre A1–D♯8                                                |
| `temperature` (softmax) | 0.1       | Distribution piquée mais lisible                             |
| `smoothingTimeConstant` | 0         | Le lissage temporel est fait par `ChromaWindow`              |

## Coût marginal des fenêtres multiples

Le chroma instantané est calculé **une seule fois** par frame. Chaque
`ChromaWindow` supplémentaire ajoute :

- 1 buffer circulaire de `N × 12 × 4` octets (Float32),
- 1 moyenne en $O(N \cdot 12)$ par aggregate (rapide : ≤ 3 600 multiplications
  pour la fenêtre 30 s).

Le coût dominant reste la FFT du navigateur (taillée pour 16 384 échantillons
toutes les 100 ms).

## Étendre

- **Accords étendus** : ajouter des entrées dans `QUALITY_INTERVALS` (par ex.
  `dom7 : [0, 4, 7, 10]`). Le reste du pipeline est agnostique au nombre de
  templates.
- **Profils mineurs alternatifs** : remplacer `KRUMHANSL_MINOR_PROFILE` par
  les profils harmonique/mélodique pour mieux capter le `#7` du jazz.
- **Pondération harmonique (HPCP)** : avant le repli en chroma, pondérer
  les bins par log-fréquence ou retirer les harmoniques supérieurs (HPS).
- **AudioWorklet** : déporter la boucle `setInterval` dans un
  `AudioWorkletNode` pour éviter de bloquer le main thread sur les longues
  sessions.
