# Tonality Detector

Détecteur **live** (entrée micro) de tonalité et d'accord, basé sur l'analyse
spectrale fenêtrée. Trois fenêtres glissantes tournent en parallèle à partir
du même flux de chromas instantanés :

| Fenêtre               | Durée par défaut | Sortie                                        | Méthode                                          |
| --------------------- | ---------------- | --------------------------------------------- | ------------------------------------------------ |
| Accord (chord window) | **1 s**          | 24 probabilités d'accord (12 maj + 12 min)    | template matching (cosinus)                      |
| Live acquisition      | **8 s**          | 24 probabilités de tonalité (12 maj + 12 min) | Krumhansl-Schmuckler maj + min (Pearson)         |
| Tonality acquisition  | **30 s**         | 24 probabilités de tonalité (12 maj + 12 min) | Krumhansl-Schmuckler maj + min (Pearson)         |
| **ToneBaseTonality**  | 8 s → 30 s       | 24 probabilités (présence)                    | High-water-mark filter + presence histogram + KK |

> Stack : Vite + React + TypeScript · Tests : Vitest · Audio : Web Audio API
> native (`getUserMedia` + `AnalyserNode`, FFT 16384).

## Installation

Pré-requis : Node.js ≥ 18 et npm.

```bash
npm install
npm run dev
```

Ouvre ensuite `http://127.0.0.1:5173` et autorise l'accès au microphone.

> ⚠️ `getUserMedia` n'est disponible que sur `localhost` ou en HTTPS. Le serveur
> Vite local est déjà en `localhost`, donc rien à configurer.

## Scripts

| Commande               | Effet                                                     |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Lance le serveur de développement Vite                    |
| `npm run build`        | Type-check (`tsc -b`) puis bundle de production           |
| `npm run preview`      | Sert le build de prod en local                            |
| `npm test`             | Tests rapides (projets Vitest `unit` + `dom`)             |
| `npm run test:samples` | Régression sur les fichiers audio de `tests/Sample`       |
| `npm run test:all`     | Toute la suite (unit + dom + samples)                     |
| `npm run test:watch`   | Vitest en mode watch                                      |
| `npm run typecheck`    | Vérification TypeScript sans émission                     |
| `npm run sweep`        | Sweep paramétrique sur tous les samples (voir ci-dessous) |

---

## Pipeline

```
Mic → AudioContext → AnalyserNode (FFT 16384, dB)
    → dB → magnitude linéaire
    → repli en chroma 12-D (pondération par énergie)
    → 3 ChromaWindow en parallèle :
        ├── 1 s  → detectChord() → 24 accords    (maj + min)
        ├── 8 s  → detectKey()   → 24 tonalités  (live acquisition)
        ├── 30 s → detectKey()   → 24 tonalités  (tonality acquisition)
        └── 8 s aggregate
              → HighWaterMarkFilter (50% × moyenne des 5 derniers pics)
              → indicateur binaire 12-D
              → 30 s presence window
              → detectKeyFromPresence() → 24 tonalités  (ToneBaseTonality)
```

Voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) pour les diagrammes
d'implémentation.

---

## Fondations mathématiques

Toutes les fenêtres partagent les mêmes étapes 1 → 4. Elles ne diffèrent que
par leur **longueur** et leur **estimateur final** (étape 5).

### 1. Spectre dB → magnitude linéaire

L'`AnalyserNode` renvoie un spectre en dB (typiquement dans `[-100, 0]`). On
convertit chaque bin en magnitude linéaire :

$$
|X_k| = 10^{S_k / 20}
$$

avec un plancher à `-90 dB` (en dessous, on force à 0 pour éviter de polluer
le chroma avec le bruit de fond).

### 2. Bin FFT → fréquence → classe de hauteur

Pour un `AnalyserNode` avec `fftSize = N`, le spectre a `N/2` bins. Le bin
`k` correspond à la fréquence :

$$
f_k = \frac{k \cdot f_s}{N}
$$

où $f_s$ est le taux d'échantillonnage de l'`AudioContext`.

La classe de hauteur (pitch class) d'une fréquence est obtenue via la formule
MIDI (référence : A4 = 440 Hz = MIDI 69) :

$$
\text{midi}(f) = 69 + 12 \cdot \log_2\!\left(\frac{f}{440}\right)
$$

$$
\text{pc}(f) = \lfloor \text{midi}(f) + 0.5 \rfloor \bmod 12
$$

Convention : `0 = C`, `1 = C#`, …, `9 = A`, …, `11 = B`.

### 3. Vecteur chroma (12-D)

On replie le spectre dans un vecteur de longueur 12 en sommant l'**énergie**
(magnitude au carré) de chaque bin dans sa classe de hauteur :

$$
c[p] = \sum_{\substack{k \\ \text{pc}(f_k) = p \\ f_{\min} \le f_k \le f_{\max}}} |X_k|^2
\quad \text{pour } p \in \{0, \dots, 11\}
$$

Puis on normalise en L1 pour que le chroma soit comparable d'une frame à
l'autre indépendamment du niveau d'entrée :

$$
\tilde c[p] = \frac{c[p]}{\sum_{q=0}^{11} c[q]}
$$

(`= 0` si tous les `c[q]` sont nuls). Bande par défaut : `[55 Hz, 5000 Hz]`.

### 4. Fenêtre glissante (moyenne)

Soit $F$ frames par seconde (10 Hz par défaut) et $T$ la durée d'une fenêtre
en secondes. La fenêtre conserve les $N = T \cdot F$ derniers chromas dans un
buffer circulaire, et expose à chaque instant leur **moyenne arithmétique** :

$$
\bar c[p] = \frac{1}{N} \sum_{t=0}^{N-1} \tilde c_t[p]
$$

Cette moyenne est ensuite L1-renormalisée. Trois fenêtres tournent en
parallèle avec $T \in \{1, 8, 30\}$ s, soit respectivement $N \in
\{10, 80, 300\}$ frames.

> **Pourquoi pas une FFT sur 8 s ou 30 s d'audio brut ?** À 48 kHz, ce serait
> 384 000 ou 1 440 000 échantillons à transformer à chaque mise à jour. La
> moyenne de chromas locaux est une excellente approximation pour les tâches
> de détection de tonalité/accord, et coûte $O(12)$ par frame au lieu de
> $O(N \log N)$ sur des millions d'échantillons.

---

## Fenêtre 1 s — Détection d'accord

**Méthode** : _template matching_ (Fujishima, 1999).

On définit pour chaque accord candidat $C$ un **template binaire** $t_C
\in \{0, 1\}^{12}$ qui vaut 1 sur les notes de l'accord et 0 ailleurs. On
considère 24 accords : **12 triades majeures** (`{0, 4, 7}` rotées) et
**12 triades mineures** (`{0, 3, 7}` rotées). Par exemple :

| Accord  | Notes      | Template (C, C#, D, …, B)              |
| ------- | ---------- | -------------------------------------- |
| C major | C, E, G    | `[1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]` |
| A minor | A, C, E    | `[1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0]` |
| F# maj  | F#, A#, C# | `[0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0]` |

Le score d'un accord est la **similarité cosinus** entre le chroma 1 s
$\bar c$ et son template :

$$
\text{score}(C) = \cos\big(\bar c, t_C\big) = \frac{\sum_{p=0}^{11} \bar c[p] \cdot t_C[p]}{\sqrt{\sum_{p=0}^{11} \bar c[p]^2} \cdot \sqrt{\sum_{p=0}^{11} t_C[p]^2}}
$$

L'accord détecté est $\hat C = \arg\max_C \text{score}(C)$. Les probabilités
de tous les accords sont obtenues par **softmax** sur les scores :

$$
P(C) = \frac{\exp(\text{score}(C) / \tau)}{\sum_{C'} \exp(\text{score}(C') / \tau)}
\quad \text{avec } \tau = 0.1
$$

**Pourquoi 1 s ?** Un accord en musique pop/rock change typiquement toutes
les 1 à 2 s. Plus court : on est dominé par les attaques transitoires (peu
de contenu harmonique stable). Plus long : on lisse plusieurs accords
consécutifs et la sortie devient confuse aux transitions.

**Pourquoi la similarité cosinus ?** Pour des templates binaires, elle est
équivalente à une mesure d'**overlap normalisé**. Elle est invariante à
l'échelle du chroma, donc insensible au niveau du signal. Elle est aussi
calculable en $O(12)$ par template.

> **Module** : [`src/analysis/chordDetection.ts`](src/analysis/chordDetection.ts) ·
> **Tests** : [`tests/chordDetection.test.ts`](tests/chordDetection.test.ts)

---

## Fenêtres 8 s & 30 s — Détection de tonalité (24 tonalités)

**Méthode** : corrélation avec les profils de **Krumhansl-Schmuckler** (KS),
calculée pour les **12 tonalités majeures et les 12 tonalités mineures**, soit
24 candidats au total.

Krumhansl & Kessler (1982) ont mesuré empiriquement deux profils tonals — une
valeur de "stabilité" pour chacun des 12 degrés relatifs à la tonique. Plus la
valeur est haute, plus la note est perçue comme typique de la tonalité :

$$
p^{\text{maj}} = (6.35,\; 2.23,\; 3.48,\; 2.33,\; 4.38,\; 4.09,\; 2.52,\; 5.19,\; 2.39,\; 3.66,\; 2.29,\; 2.88)
$$

$$
p^{\text{min}} = (6.33,\; 2.68,\; 3.52,\; 5.38,\; 2.60,\; 3.53,\; 2.54,\; 4.75,\; 3.98,\; 2.69,\; 3.34,\; 3.17)
$$

L'indice 0 est la tonique (très haut dans les deux). Pour le majeur, l'indice 4
est la tierce majeure (4.38). Pour le mineur, l'indice 3 est la tierce mineure
(5.38) — c'est ce qui les distingue. La dominante (indice 7) est élevée dans
les deux. Pour une tonalité de tonique $K$ et de mode $m \in \{\text{maj},
\text{min}\}$, on **rote** le profil correspondant :

$$
p_{K,m}[i] = p^{m}\big[(i - K) \bmod 12\big]
$$

### Corrélation de Pearson

Pour chaque **paire (tonique, mode)** $(K, m)$, on calcule la corrélation de
Pearson entre le chroma fenêtré $\bar c$ et le profil roté $p_{K,m}$ :

$$
r_{K,m} \;=\; \frac{\displaystyle \sum_{i=0}^{11} \big(\bar c[i] - \bar{\bar c}\big)\big(p_{K,m}[i] - \bar p_{K,m}\big)}{\sqrt{\displaystyle \sum_{i=0}^{11} \big(\bar c[i] - \bar{\bar c}\big)^2} \;\cdot\; \sqrt{\displaystyle \sum_{i=0}^{11} \big(p_{K,m}[i] - \bar p_{K,m}\big)^2}}
$$

où $\bar{\bar c}$ et $\bar p_{K,m}$ sont les moyennes scalaires des deux
vecteurs sur les 12 composantes. La corrélation est dans $[-1, 1]$.

### Softmax conjoint

Les **24 corrélations** sont converties en probabilités par softmax conjoint
sur l'ensemble des candidats :

$$
P(K, m) = \frac{\exp(r_{K,m} / \tau)}{\sum_{K', m'} \exp(r_{K',m'} / \tau)}
\quad \text{avec } \tau = 0.1
$$

La température $\tau$ basse rend la distribution **piquée**, tout en restant
lisse pour les cas ambigus.

### Note sur l'ambiguïté relative ↔ majeur

Le mineur naturel et son **relatif majeur** partagent exactement les mêmes
7 notes (Am ≡ C majeur, F#m ≡ A majeur, etc.). Si une pièce est jouée avec
toutes les notes de la gamme équipondérées, **les profils KK ne peuvent pas
les distinguer** — c'est mathématique, pas un bug d'implémentation. KK
disambigüe via l'**emphase relative** des degrés : un morceau qui repose sur
le do (tonique de Am) "sonne" Am ; un morceau qui repose sur le mi (tonique
de C majeur) "sonne" C majeur. En pratique : si la sortie hésite entre les
deux, les deux sont musicalement corrects.

### Pourquoi deux fenêtres (8 s et 30 s) ?

Les deux fenêtres utilisent **exactement le même estimateur**. Elles
fournissent deux compromis temporels :

| Fenêtre | Avantage                                    | Inconvénient                                      |
| ------- | ------------------------------------------- | ------------------------------------------------- |
| 8 s     | Suit les **modulations** rapides du morceau | Plus de variance, parfois confuse aux transitions |
| 30 s    | Très stable, donne la **tonalité globale**  | Met du temps à réagir à un changement de tonalité |

Lire les deux en parallèle est utile : si la fenêtre 8 s s'éloigne de la
fenêtre 30 s, c'est typiquement le signe d'une modulation ou d'un emprunt.

> **Module** : [`src/analysis/keyDetection.ts`](src/analysis/keyDetection.ts) ·
> **Tests** : [`tests/keyDetection.test.ts`](tests/keyDetection.test.ts)

---

## ToneBaseTonality — détection par présence des notes

**Méthode** : approche complémentaire à la détection par énergie. Au lieu de
sommer les énergies brutes du chroma, on **binarise** les notes "réellement
jouées" à chaque frame (après un filtre adaptatif), puis on compte leur
**fréquence d'apparition** sur la fenêtre de tonalité (30 s par défaut).
L'histogramme de présence est ensuite passé à Krumhansl-Schmuckler.

### Étape 1 — Filtre high-water-mark sur la fenêtre live (8 s)

À chaque frame, on a le chroma agrégé sur la fenêtre live $\bar c \in
\mathbb{R}^{12}_+$. On en extrait le **pic** :

$$
P_t = \max_{p} \bar c[p]
$$

On maintient une **mémoire circulaire** des $M$ derniers pics
$\{P_{t-M+1}, \dots, P_t\}$ avec $M \in [2, 15]$ (paramétrable, défaut 5),
et un **agrégat** (moyenne ou médiane, paramétrable) :

$$
\bar P_t = \text{agg}\big(P_{t-M+1}, \dots, P_t\big)
$$

Le **seuil** dépend de la tolérance $\alpha \in [0, 1]$ (paramétrable,
défaut 0,5) :

$$
\theta_t = \alpha \cdot \bar P_t
$$

Le chroma filtré est :

$$
\tilde c_t[p] = \begin{cases} \bar c[p] & \text{si } \bar c[p] \ge \theta_t \\ 0 & \text{sinon}\end{cases}
$$

> **Pourquoi médiane plutôt que moyenne ?** La médiane (mode optionnel) est
> robuste aux pics isolés : un coup de gratte un peu fort ne fait pas
> exploser le seuil pendant les frames suivantes. À tester selon ton matériel
> / ton jeu.

### Étape 2 — Indicateur binaire de présence

On binarise le chroma filtré frame par frame :

$$
b_t[p] = \mathbb{1}\big[\tilde c_t[p] > 0\big] \in \{0, 1\}^{12}
$$

C'est l'information "à l'instant $t$, la note $p$ est-elle dominante ?".

### Étape 3 — Histogramme de présence sur 30 s

On accumule les indicateurs sur la fenêtre de tonalité (durée $T_\text{ton}$,
$N_\text{ton} = T_\text{ton} \cdot F$ frames) :

$$
h[p] = \frac{1}{N_\text{ton}} \sum_{t} b_t[p]\quad \in [0, 1]
$$

$h[p]$ est la **fraction du temps** où la note $p$ a été dominante sur les
30 dernières secondes. C'est l'**histogramme de présence**.

### Étape 4 — Détection KK sur l'histogramme

L'histogramme $h$ remplace le chroma standard dans la corrélation de Pearson
avec les profils Krumhansl-Schmuckler majeurs et mineurs (cf. section
précédente). Softmax conjoint sur les 24 corrélations à $\tau = 0,1$ →
probabilités.

### Réglages exposés (Settings panel)

| Paramètre            | Range       | Effet                                                   |
| -------------------- | ----------- | ------------------------------------------------------- |
| Live acquisition     | 1–30 s      | Taille de la fenêtre du chroma agrégé qui sert d'entrée |
| Tonality acquisition | 5–120 s     | Taille de l'histogramme de présence                     |
| Max filter tolerancy | 0–100 %     | $\alpha$ : seuil = $\alpha$ × agrégat des pics          |
| Max memory           | 2–15        | $M$ : nombre de pics conservés                          |
| Peak aggregator      | mean/median | Comment combiner les $M$ pics                           |

### Pourquoi cette approche ?

| Approche                | Force                                                                          | Faiblesse                                                                            |
| ----------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Énergie (live/tonality) | Réagit aux dynamiques : un coup fort domine la détection                       | Une note jouée fort une seule fois pollue la statistique                             |
| **Présence**            | **Une note jouée doucement mais souvent compte autant qu'une note jouée fort** | Le seuil doit être bien réglé (pas trop bas ⇒ tout passe, pas trop haut ⇒ tout zéro) |

Lire les **trois sorties en parallèle** est utile : si elles convergent,
forte confiance ; si elles divergent, le morceau est ambigu (modulation,
gamme exotique, pondération inhabituelle des degrés).

> **Modules** : [`src/analysis/highWaterMark.ts`](src/analysis/highWaterMark.ts),
> [`src/analysis/presenceTonality.ts`](src/analysis/presenceTonality.ts) ·
> **Tests** : [`tests/highWaterMark.test.ts`](tests/highWaterMark.test.ts) +
> intégration dans [`tests/samples/`](tests/samples/)

---

## Structure du projet

```
src/
├── analysis/                       # DSP & musicologie (testable sans navigateur)
│   ├── chroma.ts                   # spectre → chroma 12-D
│   ├── windowing.ts                # fenêtre glissante (avec resize)
│   ├── keyDetection.ts             # Krumhansl-Schmuckler maj + min + softmax
│   ├── chordDetection.ts           # 24 templates + cosinus + softmax
│   ├── highWaterMark.ts            # filtre adaptatif (tolerancy / memory)
│   ├── presenceTonality.ts         # détection KK à partir d'un histogramme de présence
│   └── fft.ts                      # FFT pure-JS (pour tests offline)
├── audio/                          # Couche Web Audio (navigateur uniquement)
│   ├── micStream.ts
│   └── analyser.ts
├── components/                     # Vues React
│   ├── MicCapture.tsx
│   ├── ChromaView.tsx
│   ├── KeyProbabilities.tsx
│   ├── ChordView.tsx
│   ├── SettingsPanel.tsx           # sliders ToneBaseTonality
│   └── ToneBaseTonalityView.tsx    # histogramme + ranking présence
├── hooks/
│   └── useTonality.ts              # orchestre toutes les fenêtres + ToneBase
├── utils/
│   └── notes.ts                    # fréquence ↔ MIDI ↔ pitch class
├── App.tsx
├── App.css
└── main.tsx

tests/
├── notes.test.ts
├── chroma.test.ts
├── windowing.test.ts                # inclut resize + aggregateRaw
├── keyDetection.test.ts             # maj + min + relatifs
├── chordDetection.test.ts
├── highWaterMark.test.ts            # filtre adaptatif (tolerancy / memory / mode)
├── fft.test.ts                      # vérifie la FFT pure-JS (cas connus)
├── samples.test.ts                  # tests d'intégration sur fichiers audio réels
│                                    # (clean + FL Studio noisy, énergie + présence)
├── helpers/
│   └── offlinePipeline.ts           # décode mp3 + FFT Node-side
└── Sample/                          # samples audio
    ├── Am*.mp3, Bm*.mp3, F#m*.mp3   # clean : grilles + tonalités improvisées
    └── FLStudio/                    # noisy : drums + bruit + instruments noyés
        └── CAmDmG_<transpose>_<variant>.mp3
```

### Convention de nommage FL Studio

`<ChordGrid>_<transpositionSemitones>_<variantInstrument>.mp3`

La grille est lue chord-par-chord : `[A-G] [#]? [m]?`. Ex. `CAmDmG_2_2` =
[C, Am, Dm, G] transposé +2 demi-tons → [D, Bm, Em, A], variante n°2.

### Sweep paramétrique

`npm run sweep` lance [`scripts/parameterSweep.ts`](scripts/parameterSweep.ts).
Le script charge tous les samples une fois (décodage + FFT), puis itère sur
une grille de paramètres pour la détection d'accord et pour
ToneBaseTonality. Il imprime les top combinaisons et les défauts recommandés.

Les défauts du projet (`HIGH_WATER_MARK_DEFAULTS`, `DEFAULT_SETTINGS` dans
App.tsx) sont **issus de ce sweep** sur le mix samples clean + FL Studio
noisy : `tolerancy=0.35`, `memory=3`, `mode=mean`, fenêtres 8 s / 30 s.

## Choix techniques

- **Pas de lib FFT externe** : `AnalyserNode` est déjà optimisé en C++ par le
  navigateur. Pour un usage hors-navigateur, on pourra remplacer par une
  vraie FFT (ex. `fft.js`) sans rien changer aux modules `analysis/`.
- **Profils majeurs uniquement pour les tonalités** (KS major). Les accords
  couvrent majeurs **et** mineurs (24 templates).
- **Fenêtre glissante = liste de chromas, pas un buffer audio.** Voir la
  note dans la section §4 ci-dessus.
- **Désactivation explicite** d'AGC, suppression de bruit et écho. Ces
  traitements navigateur ajoutent du gain dynamique et déforment le spectre,
  ce qui fausse les chromas.
- **3 fenêtres = 3 buffers + 0 FFT supplémentaire**. Le coût marginal des
  fenêtres 8 s / 30 s / 1 s est négligeable car elles partagent le même
  chroma instantané — on ne paie qu'une seule FFT par frame.

## Tester

```bash
npm test
```

Les tests couvrent :

- conversions fréquence ↔ note ↔ pitch class,
- chroma à partir de spectres synthétiques (sinusoïdes pures, repliement
  d'octaves, filtres min/max fréquence),
- comportement de la fenêtre glissante (capacité, éviction, normalisation),
- détection de tonalité : profils exacts (maj + min), gammes majeures
  (12 toniques) et mineures (avec emphase du triade), progression I–V–vi–IV
  en C, distribution uniforme sur chroma plat, ambiguïté minor ↔ relatif
  majeur documentée,
- **tests d'intégration sur fichiers audio réels** (`tests/Sample/`) :
  - grilles d'accord : `AmDmEAm.mp3`, `AmGFE.mp3` → **histogramme à fenêtre
    glissante** (1 s, stride 0,25 s) ; tous les accords joués doivent dominer
    l'histogramme (top-(N+2) où N = accords uniques),
  - tonalités improvisées : `AmTona.mp3`, `BmTona.mp3`, `F#mTona.mp3` →
    top-5 sur les 24 candidats doit contenir soit la tonalité mineure
    annoncée, soit son relatif majeur,
- FFT pure-JS (DFT analytique de Diracs, sinusoïdes pures, identité de
  Parseval, fenêtre Hann),
- détection d'accord : 12 majeurs + 12 mineurs par transposition,
  relatives (Am ↔ C), similarité cosinus (orthogonalité, scale-invariance),
- softmax (stabilité numérique, température).

## Limitations connues

- Mono uniquement : le pipeline ne traite qu'un canal.
- Pas de transposition d'octave : on suppose A4 = 440 Hz (concert pitch).
- Accords : **triades majeures et mineures uniquement** (pas de 7e, sus, dim,
  aug).
- Détection orientée musique tonale occidentale.
- **Ambiguïté minor ↔ relatif majeur** : intrinsèque à KK quand le morceau ne
  privilégie aucun tonique. Voir la section "Détection de tonalité" §
  _Ambiguïté relative ↔ majeur_.

## Roadmap

- Templates étendus pour les accords (dom7, dim, sus, aug).
- Profils mineurs harmoniques / mélodiques (pour mieux capter le `#7` du jazz).
- Chronologie temporelle (estimation de tonalité / d'accord dans le temps).
- Export des chromas agrégés en CSV.
- `AudioWorklet` pour déporter le polling hors du main thread.
