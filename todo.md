# TODO

## Bugs
- [x] **`nodeSprites.ts`** — `case NodeShape.TextOnly || NodeShape.TextOnlyHighlighted:` evaluates to `case 100:` at runtime. `TextOnlyHighlighted` falls through to `default: → Circle`, gets a circle sprite allocated, then immediately hidden via `alpha = 0` in `initNodeGraphics`. Benign today (works correctly) but wasteful and fragile. Needs two separate `case` labels.
- [ ] **`forcesSimulation.ts`** — TTL check changed from `timeToLiveTo !== undefined && framesAlive >= timeToLiveTo` to just `timeToLiveTo !== undefined`. Nodes with a far-future TTL immediately stop participating in force simulation when marked for removal, instead of fading out naturally. Edge forces also disappear at mark-time, not at expiry.
- [ ] **`dispose.ts`** — `proxyEdgesMap` is reset twice in a row; `proxyNodesMap` is never cleared.
- [ ] **`destroyExpired.ts`** — nodes that expire naturally (had `timeToLiveTo` set at init, never went through `removeData`) don't clean their ID out of neighbors' `adjacentNodeIds`. Those neighbors will incorrectly suppress push forces between each other after the node is gone.
- [ ] **`addData.ts` / `processPendingData.ts`** — `onFinished` fires immediately when `addData` is called with edges only (no nodes), before those edges are processed. Also, `addTrackers` are flushed mid-tick after the node batch but before the edge batch, so `onFinished` can fire before associated edges are rendered.

## Performance
- [ ] **`processPendingData.ts`** — entire `notRenderedEdgesById` Map is iterated every tick even when no new nodes were added that tick. Gate the loop on `nodeBatch.length > 0`.
- [ ] **`addGrafika.ts` `getData()`** — now calls `.map()` over the full node/edge arrays on every invocation (was a direct list reference). Callers that poll `getData()` frequently pay an unnecessary allocation per call.
- [ ] Wire in `quadtree.ts` to replace O(n²) push force loop in `forcesSimulation.ts`
- [ ] Dirty tracking — skip render frames when sim stopped, viewport idle, no node changes
- [ ] Batch ProxyNode mutations — defer `initNodeGraphics`/`handleNodeLoading` instead of calling per-property-set

## Correctness
- [ ] Frame-count lifecycle (`timeToLiveFrom/To`, fade effects) is FPS-dependent — consider ms-based timing

## Code quality
- [ ] Resolve the "I don't really understand" comment in `forcesSimulation.ts:71`
- [ ] Move `framePassed` off the mitt event bus (direct callback, it's a 60Hz hot path)
