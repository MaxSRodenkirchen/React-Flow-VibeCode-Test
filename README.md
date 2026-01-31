ReadMe created by Gemini 

# IVCO Pattern Design Tool

Dies ist ein interaktives Werkzeug zur Visualisierung und Erstellung von Design-Patterns, basierend auf **React** und **React Flow**. Es dient dazu, komplexe Pattern-Systeme intuitiv zu gestalten und zu dokumentieren.

## 🚀 Die Anwendung

Das Tool ist in drei Hauptbereiche unterteilt:

- **Explore View (Whiteboard):** Das Herzstück der Anwendung. Hier können Patterns aus der Bibliothek per Drag-and-Drop platziert, verschoben und miteinander verknüpft werden.
- **Define View (Editor):** Ein dedizierter Editor zum Erstellen und Bearbeiten von Pattern-Templates. Hier werden Metadaten, Beschreibungen und Tags festgelegt.
- **Materialize View:** Eine ergänzende Ansicht zur Dokumentation oder Evaluierung der erstellten Systeme (basiert auf Markdown).

### Besondere Features
- **LOD (Level of Detail):** Knoten passen ihren Detailgrad automatisch an den Zoom-Faktor an oder können manuell umgeschaltet werden (Titel -> Balanced -> Full).
- **Autosave:** Jede Änderung am Layout wird sofort im Hintergrund gespeichert.
- **Intelligente Verbindungen:** Flow-Edges visualisieren Datenströme, während Standard-Edges strukturelle Beziehungen zeigen.

---

## 🏗️ Architektur

Die Anwendung folgt einer modularen Architektur:

- **Frontend:** Erstellt mit **React 18** und **Vite**. Die Graph-Logik wird durch **React Flow** realisiert.
- **Data Service:** Die Datei `src/dataService.js` dient als Abstraktionsschicht. Sie entscheidet, ob Daten von einem Server geladen werden oder statisch aus dem Bundle kommen.
- **State Management:** Lokaler Status wird über React Hooks (`useState`, `useCallback`, `useMemo`) verwaltet, während die Persistenz entweder über eine API oder lokale JSON-Imports erfolgt.

---

## 🖇️ Git-System & Betriebsmodi

Das Projekt ist so strukturiert, dass es sowohl als lokales Redaktions-Tool als auch als statische Online-Demo fungieren kann. Dies wird über zwei primäre Git-Branches gesteuert:

### 1. Normal Mode (Branch: `main`)
Dieser Modus wird für die aktive Arbeit und Erstellung von Inhalten genutzt.
- **Persistence:** Nutzt einen lokalen **Node.js Express Server** (`server/server.js`), der Daten direkt im Dateisystem ablegt.
- **Workflow:** 
    - Start des Frontends: `npm run dev`
    - Start des Backends: `node server/server.js`
- **Datei-Ablage:** Patterns werden als einzelne `.json` Dateien in `src/assets/PatternsJson/` gespeichert.

### 2. Exhibition Mode (Branch: `exhibition-mode`)
Dieser Modus ist für die Veröffentlichung (z.B. via GitHub Pages) optimiert.
- **Persistence:** Funktioniert komplett **serverlos**. In diesem Branch ist der `dataService` so konfiguriert, dass er alle JSON-Dateien via Vite `import.meta.glob` direkt in das JavaScript-Bundle kompiliert.
- **Schreibschutz:** Speicher- und Löschoperationen sind deaktiviert, was die Anwendung sicher für öffentliche Terminals oder Online-Demos macht.
- **Deployment:** Änderungen aus `main` werden in `exhibition-mode` gemerget, dort gebaut und dann auf den `gh-pages` Branch hochgeladen.

---

## 🛠️ Installation & Start

1. **Repository klonen**
2. **Abhängigkeiten installieren:**
   ```bash
   npm install
   cd server && npm install
   ```
3. **Anwendung im Normal Mode starten:**
   - Terminal 1: `npm run dev`
   - Terminal 2: `node server/server.js`
4. **Browser öffnen:** `http://localhost:5173`
