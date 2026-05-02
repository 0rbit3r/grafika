# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build     # vite build (bundles to dist/) + tsc (emits .d.ts files)
npm run dev       # vite dev server (no real entry point — library only)
npm run preview   # preview the vite build
```

There is no test suite.

## Architecture

Grafika is a TypeScript library for force-directed graph rendering built on **PixiJS v7**. The single public entry point is `addGrafika(element, settings)` (`src/api/addGrafika.ts`), which returns a `GrafikaInstance`.

### Data flow

```
addGrafika()
  ├── creates GraphStoresContainer  (src/state/storesContainer.ts)
  ├── calls initGraphics()          (src/graphics/initGraphics.ts)  → returns renderGraph()
  └── starts app.ticker loop:
        1. simulate_one_frame_of_FDL()   (updates x/y on RenderedNodes)
        2. interactionEvents.emit("framePassed")
        3. renderGraph()                 (positions PixiJS sprites)
```

### State — `GraphStoresContainer`

Plain mutable objects, one per grafika instance (no global singletons):

| Store | Purpose |
|---|---|
| `context` | Runtime graph data: `RenderedNode[]`, `RenderedEdge[]`, proxy maps, adjacency map |
| `graphics` | PixiJS app/containers, viewport, settings |
| `simulation` | Physics state: frame counter, forces config, flags |
| `debug` | Debug flags (FPS overlay) |

### Node/Edge duality

There are two parallel representations:

- **`GraphNode` / `GraphEdge`** (`src/api/dataTypes.ts`) — plain data input objects passed by the consumer
- **`RenderedNode` / `RenderedEdge`** (`src/core/`) — internal runtime objects that hold PixiJS sprites, forces, momentum, `framesAlive`, etc.
- **`ProxyNode` / `ProxyEdge`** (`src/api/proxy*.ts`) — JS `Proxy` wrappers over `RenderedNode`/`RenderedEdge` exposed via `getData()`. Writing visual properties (color, shape, etc.) on a proxy triggers `initNodeGraphics` + `handleNodeLoading` automatically.

### Graphics

- Sprites are pre-rendered textures defined in `src/graphics/sprites/` (`nodeSprites.ts`, `edgeSprites.ts`, `effectSprites.ts`).
- `initNodeGraphics` / `initEdgeGraphics` assign the correct sprite to a rendered object; `dynamicLoader.ts` lazily adds sprites to PixiJS containers when they first come on screen.
- The viewport (`src/graphics/viewport/`) handles pan/zoom/drag via PixiJS drag containers and translates world coordinates → screen coordinates each frame.
- Optional overlay and backdrop images (`src/graphics/overlay/`, `src/graphics/backdrop/`) respond to zoom level.
- Z-ordering constants live in `src/graphics/zIndexes.ts`.

### Simulation

`simulate_one_frame_of_FDL` (`src/simulation/forcesSimulation.ts`) implements force-directed layout:
- **Pull** along edges toward ideal distance (edge `length` × adjacency count factor)
- **Push** between unconnected nodes within `pushThreshold`
- **Gravity** pulls all nodes toward origin beyond `GRAVITY_FREE_RADIUS`
- Force constants live in `src/core/defaultGraphOptions.ts`

### Events

`interactionEvents` is a `mitt` emitter typed to `InteractionEvents` (`src/api/events.ts`). Events: `nodeClicked`, `nodeDragged`, `viewportMoved`, `viewportZoomed`, `framePassed`, `backgroundClicked`.
