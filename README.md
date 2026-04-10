# 1000 Years of Classical Music

An interactive single-page website exploring Western art music from medieval plainchant to contemporary minimalism — built from an Obsidian vault.

## Features

- **Grand Timeline** — pan and zoom across 1000 years of music history. Eras are laid out in non-overlapping lanes; composer lifespans are shown as bars. Names scale with zoom level.
- **Composer Graph** — force-directed network of 100+ composers grouped by era, with influence edges. Drag nodes, filter by era, zoom and pan.
- **Eight Era Pages** — dedicated pages for Early Music, Renaissance, Baroque, Classical, Romantic, Nationalism, Modern, and Contemporary eras.
- **Parallax hero** and divider sections with quotes.
- Fully static — no build step, no dependencies, no frameworks.

## Structure

```
index.html          # Main page (timeline + graph + era grid)
data.js             # All composer data and influence edges
main.js             # Timeline and graph rendering logic
style.css           # All styles
early-music.html
renaissance.html
baroque.html
classical-era.html
romantic.html
nationalism.html
modern.html
contemporary.html
```

## Running Locally

Just open `index.html` in a browser — no server needed.

```bash
open index.html
```

Or serve it with any static file server:

```bash
npx serve .
```

## Data

All composer data lives in `data.js`:
- 100+ composers with birth/death years and a signature work
- Era color palette
- Influence edges (index pairs into the `COMPOSERS` array)

To add a composer, append an entry to the `COMPOSERS` array and optionally add influence edges to `INFLUENCES`.

## Tech

Vanilla HTML, CSS, and JavaScript. No libraries. Canvas API for the graph view.
