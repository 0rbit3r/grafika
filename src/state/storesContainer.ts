import { PreinitializedMapStore } from "nanostores";
import {createSimulationStore, SimulationStore} from "./simulationStore";
import { Application } from "pixi.js";
import {createGraphicsStore, GraphicsStore } from "./graphicsStore"
import { createDebugStore, DebugStore } from "./debugStore";
import {ContextStore, createContextStore} from "./contextStore";
import { GraphSettings } from "../api/settings";
import { Emitter } from "mitt";
import { GraphInteractionEvents } from "../api/events";

// nanostores creates a singleton state - for multiple graphs (and ths states) per page we need to compartmentalize
export interface GraphStoresContainer {
    interactionEvents: Emitter<GraphInteractionEvents>,
    simulation: PreinitializedMapStore<SimulationStore>,
    graphics: PreinitializedMapStore<GraphicsStore>,
    debug: PreinitializedMapStore<DebugStore>,
    context: PreinitializedMapStore<ContextStore>
}

export function createGraphStores(pixiApp: Application, settings: GraphSettings, interactionEvents: Emitter<GraphInteractionEvents>): GraphStoresContainer {
    return {
        simulation: createSimulationStore(settings.simulation),
        graphics: createGraphicsStore(pixiApp, interactionEvents, settings.graphics),
        debug: createDebugStore(settings.debug),
        context: createContextStore(),
        interactionEvents: interactionEvents
    }
}