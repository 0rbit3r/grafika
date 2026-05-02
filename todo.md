# TODO

## Performance
- [ ] Wire in `quadtree.ts` to replace O(n²) push force loop in `forcesSimulation.ts`
- [ ] Dirty tracking — skip render frames when sim stopped, viewport idle, no node changes
- [ ] Batch ProxyNode mutations — defer `initNodeGraphics`/`handleNodeLoading` instead of calling per-property-set

## Correctness
- [ ] Frame-count lifecycle (`timeToLiveFrom/To`, fade effects) is FPS-dependent — consider ms-based timing

## Code quality
- [ ] Resolve the "I don't really understand" comment in `forcesSimulation.ts:71`
- [ ] Move `framePassed` off the mitt event bus (direct callback, it's a 60Hz hot path)
