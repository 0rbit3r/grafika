import {createSimulationStore, SimulationStore} from "./simulationStore";
import { Application } from "pixi.js";
import {createGraphicsStore, GraphicsStore } from "./graphicsStore"
import { createDebugStore, DebugStore } from "./debugStore";
import {ContextStore, createContextStore} from "./contextStore";
import { GrafikaSettings } from "../api/settings";
import { Emitter } from "mitt";
import { InteractionEvents } from "../api/events";

// nanostores creates a singleton state - for multiple graphs (and ths states) per page we need to compartmentalize
export interface GraphStoresContainer {
    interactionEvents: Emitter<InteractionEvents>,
    simulation: SimulationStore,
    graphics: GraphicsStore,
    debug: DebugStore,
    context: ContextStore
}

export function createGraphStores(pixiApp: Application, settings: GrafikaSettings, interactionEvents: Emitter<InteractionEvents>): GraphStoresContainer {
    return {
        simulation: createSimulationStore(settings.simulation),
        graphics: createGraphicsStore(pixiApp, interactionEvents, settings.graphics),
        debug: createDebugStore(settings.debug),
        context: createContextStore(),
        interactionEvents: interactionEvents
    }
}