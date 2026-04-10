<div align="center">

# 🎼 1000 Years of Classical Music

**An interactive journey through Western art music — from medieval plainchant to contemporary minimalism.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-black?style=for-the-badge&logo=github)](https://anuraagrath.github.io/classical-music/)
![HTML](https://img.shields.io/badge/HTML-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

</div>

---

## ✨ Features

### 🗺️ Grand Timeline
Pan and zoom across 1,000 years of music history. Composer lifespans are rendered as bars across a scrollable canvas. Overlapping eras are separated into clean lanes — no clutter. Labels dynamically appear and disappear as you zoom in and out.

### 🕸️ Composer Influence Graph
A force-directed network of 100+ composers grouped by era, with edges showing who influenced whom. Drag nodes, filter by era, zoom and pan freely.

### 📖 Eight Era Deep-Dives
Dedicated pages for every era — each with key composers, defining characteristics, landmark works, and listening recommendations.

| Era | Period |
|-----|--------|
| Early Music | 1000 – 1400 |
| Renaissance | 1400 – 1600 |
| Baroque | 1600 – 1750 |
| Classical | 1750 – 1820 |
| Romantic | 1810 – 1920 |
| Nationalism | 1830 – 1920 |
| Modern | 1900 – 1950 |
| Contemporary | 1950 – present |

### 🎨 Design
- Parallax hero and divider sections
- Smooth scroll animations
- Fully responsive
- Zero dependencies — pure HTML, CSS, and Canvas API

---

## 🗂️ Project Structure

```
├── index.html           # Main page — timeline, graph, era grid
├── data.js              # All composer data & influence edges
├── main.js              # Timeline & graph rendering
├── style.css            # All styles
├── early-music.html
├── renaissance.html
├── baroque.html
├── classical-era.html
├── romantic.html
├── nationalism.html
├── modern.html
└── contemporary.html
```

---

## 🚀 Run Locally

No install, no build step. Just:

```bash
python3 -m http.server 8080
```
Then open [http://localhost:8080](http://localhost:8080)

---

## ➕ Adding a Composer

Open `data.js` and append to the `COMPOSERS` array:

```js
{ name:"Clara Schumann", era:"Romantic Era", born:1819, died:1896, work:"Piano Concerto in A minor" }
```

Optionally add influence edges to `INFLUENCES` as index pairs.

---

## 🌱 Origin

Built from a personal [Obsidian](https://obsidian.md) vault on classical music. The notes became a website.

---

<div align="center">
<sub>Made with ♩ by <a href="https://github.com/anuraagrath">anuraagrath</a></sub>
</div>
