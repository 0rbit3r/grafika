import { PreinitializedMapStore } from "nanostores";
import {createSimulationStore, SimulationStore} from "./simulationStore";
import { Application } from "pixi.js";
import {createGraphicsStore, GraphicsStore } from "./graphicsStore"
import { createDebugStore, DebugStore } from "./debugStore";
import {ContextStore, createContextStore} from "./contextStore";
import { GraphSettings } from "../api/settings";

// nanostores creates a singleton state - for multiple graphs (and ths states) per page we need to compartmentalize
export interface GraphStoresContainer {
    simulation: PreinitializedMapStore<SimulationStore>,
    graphics: PreinitializedMapStore<GraphicsStore>,
    debug: PreinitializedMapStore<DebugStore>,
    context: PreinitializedMapStore<ContextStore>
}

export function createGraphStores(pixiApp: Application, settings: GraphSettings): GraphStoresContainer {
    return {
        simulation: createSimulationStore(settings.simulation),
        graphics: createGraphicsStore(pixiApp, settings.graphics),
        debug: createDebugStore(settings.debug),
        context: createContextStore(settings.data)
    }
}