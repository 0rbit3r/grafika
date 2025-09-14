import { PreinitializedMapStore } from "nanostores";
import {createSimulationStore, SimulationStore} from "./simulationStore";
import { Application } from "pixi.js";
import {createGraphicsStore, GraphicsStore } from "./graphicsStore"
import { createDebugStore, DebugStore } from "./debugStore";
import {ContextStore, createContextStore} from "./contextStore";
import { GraphSettings } from "../api/settings";
import { GraphCallbacks } from "../api/controlTypes";

// nanostores creates a singleton state - for multiple graphs (and ths states) per page we need to compartmentalize
export interface GraphStoresContainer {
    hooks: GraphCallbacks,
    simulation: PreinitializedMapStore<SimulationStore>,
    graphics: PreinitializedMapStore<GraphicsStore>,
    debug: PreinitializedMapStore<DebugStore>,
    context: PreinitializedMapStore<ContextStore>
}

export function createGraphStores(pixiApp: Application, settings: GraphSettings, hooks: GraphCallbacks): GraphStoresContainer {
    return {
        simulation: createSimulationStore(settings.simulation),
        graphics: createGraphicsStore(pixiApp, hooks, settings.graphics),
        debug: createDebugStore(settings.debug),
        context: createContextStore(),
        hooks: hooks
    }
}