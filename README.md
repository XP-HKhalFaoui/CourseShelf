# 📚 CourseShelf

**Offline SCORM Course Library & Player for Interactive Whiteboards**

CourseShelf is a cross-platform Electron desktop app that lets educators import, manage, and launch SCORM course packages entirely offline — optimized for interactive whiteboard (IWB) use.

---

## ✨ Features

- **ZIP Import** — Drop in any SCORM `.zip` and CourseShelf extracts, parses, and catalogs it
- **Smart Manifest Detection** — Parses `imsmanifest.xml` with multi-level fallback (wrapper folders, `index.html`, first `.html`)
- **SCORM 1.2 & 2004** — Auto-detects schema version from package metadata
- **Offline-First** — Everything runs locally from `~/.courseshelf/cache/`
- **IWB-Friendly UI** — Large touch targets (44px+), responsive grid, dark theme
- **Secure Architecture** — Context isolation, no Node in renderer, `contextBridge` API
- **Dedicated Player Window** — Courses open in their own window with external link interception

---

## 📁 Project Structure

```
courseshelf/
├── package.json
├── forge.config.ts
├── tsconfig.json
├── vite.main.config.ts
├── vite.preload.config.ts
├── vite.renderer.config.ts
├── .gitignore
└── src/
    ├── shared/
    │   └── types.ts              # Shared types + IPC channel contracts
    ├── main/
    │   ├── main.ts               # Electron Main process entry
    │   ├── services/
    │   │   ├── zip-service.ts    # ZIP extraction to local cache
    │   │   ├── manifest-parser.ts # imsmanifest.xml parser + fallback
    │   │   └── library-service.ts # Course library CRUD (JSON-based)
    │   └── windows/
    │       └── player-window.ts  # Course player BrowserWindow
    ├── preload/
    │   └── preload.ts            # Secure contextBridge API
    └── renderer/
        ├── index.html            # Library UI shell
        ├── renderer.ts           # UI logic (event handlers, rendering)
        └── styles.css            # Full CSS (IWB-friendly, touch-friendly)
```

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/XP-HKhalFaoui/CourseShelf.git
cd CourseShelf

# 2. Install dependencies
npm install

# 3. Run in development mode
npm start

# 4. Test: click "+ Add Course (ZIP)" → select a SCORM .zip
#    → it extracts, parses, appears in library, and launches on click
```

---

## 📦 Building for Distribution

```bash
# Package for Windows
npm run make -- --platform=win32

# Package for macOS
npm run make -- --platform=darwin

# Package for Linux
npm run make -- --platform=linux

# Output: installers in ./out/make/
```

---

## 🏗️ Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Main Process | Electron + Node.js | File I/O, IPC handlers, window management |
| Preload | contextBridge | Secure API bridge (no Node in renderer) |
| Renderer | Vanilla TS + CSS | Library UI, event handling |
| Storage | JSON file | `{userData}/course-library.json` |
| Cache | File system | `~/.courseshelf/cache/{uuid}/` |

### Import Flow

1. User clicks **+ Add Course (ZIP)**
2. Native file dialog opens → user selects `.zip`
3. Main process extracts ZIP → parses manifest → saves to library
4. Renderer refreshes the course grid

### Manifest Detection Priority

1. `imsmanifest.xml` in root → parse XML → resolve `<resource href>`
2. `imsmanifest.xml` one level down (wrapper folder)
3. `index.html` in root
4. First `.html` file in root
5. Error: "Could not detect a launch file"

---

## 🗺️ Roadmap

| Priority | Feature | Status |
|----------|---------|--------|
| P0 | Core engine (ZIP + manifest + library) | ✅ Done |
| P0 | Library UI (responsive grid, dark theme) | ✅ Done |
| P0 | Player window (dedicated, secure) | ✅ Done |
| P1 | Player toolbar (Home, Back, Forward, Reload, Fullscreen, Zoom) | 🔲 Next |
| P1 | Keyboard shortcuts (Esc, Ctrl+/-) | 🔲 Next |
| P2 | USB/portable mode — copy from USB to cache | 🔲 Planned |
| P2 | course.json support — title/level/unit from JSON inside ZIP | 🔲 Planned |
| P3 | Window state persistence (electron-store) | 🔲 Planned |
| P3 | Code signing (Windows + macOS notarization) | 🔲 Planned |
| P4 | Thumbnail/cover image per course | 🔲 Planned |

---

## 🛠️ Tech Stack

- **Electron** 33+ with Electron Forge
- **Vite** for fast builds (main, preload, renderer)
- **TypeScript** throughout
- **adm-zip** for ZIP extraction
- **fast-xml-parser** for imsmanifest.xml parsing
- **uuid** for unique course IDs

---

## 📄 License

MIT © [XP-HKhalFaoui](https://github.com/XP-HKhalFaoui)
