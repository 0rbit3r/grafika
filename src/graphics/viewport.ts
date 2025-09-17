import { Application, Container, DisplayObject, Rectangle } from "pixi.js";
import { INITIAL_ZOOM, MIN_ZOOM, ZOOM_STEP_MULTIPLICATOR_BUTTONS, MAX_ZOOM, ZOOM_STEP_MULTIPLICATOR_WHEEL } from "../core/defaultGraphOptions";
import { XAndY } from "../api/dataTypes";
import { GraphInteractionEvents } from "../api/events";
import { Emitter } from "mitt";


export class Viewport {
    height: number;
    width: number;
    position: XAndY;
    zoom: number;
    // indicates whether the viewport is being dragged/moved by the user
    dragged: boolean;
    // indicates whether the viewport follows a highlighted node
    lockedOnNode: boolean;
    // onScreenSizeChange: () => void;
    interactionEvents: Emitter<GraphInteractionEvents>;

    dragContainer: Container;

    constructor(width: number, height: number, dragContainer: Container, interactionEvents: Emitter<GraphInteractionEvents>) {
        this.width = width;
        this.height = height;
        this.zoom = INITIAL_ZOOM;
        this.position = { x: 0, y: 0 };
        this.dragged = false;
        this.lockedOnNode = false;
        this.dragContainer = dragContainer;
        this.interactionEvents = interactionEvents;
    }

    public resizeHitArea = (width: number, height: number) => {
        this.width = width;
        this.height = height;
        this.dragContainer.hitArea = new Rectangle(0, 0, width, height);
    }

    // Moves the viewport by zoom-corrected amount
    public moveByZoomed = (delta: XAndY) => {
        this.moveBy({ x: delta.x / this.zoom, y: delta.y / this.zoom });
    }

    // Moves the viewport by global coordinates
    public moveBy = (delta: XAndY) => {
        this.position.x -= delta.x;
        this.position.y -= delta.y;

        // border behavior
        // if (!useGraphControlsStore.getState().strongerPushForce) {

        //     if (this.position.x > GRAVITY_FREE_RADIUS)
        //         this.position.x = GRAVITY_FREE_RADIUS;
        //     if (this.position.y > GRAVITY_FREE_RADIUS)
        //         this.position.y = GRAVITY_FREE_RADIUS;
        //     if (this.position.x < -GRAVITY_FREE_RADIUS)
        //         this.position.x = -GRAVITY_FREE_RADIUS;
        //     if (this.position.y < -GRAVITY_FREE_RADIUS)
        //         this.position.y = -GRAVITY_FREE_RADIUS;
        // }
    }
    
    toViewportCoordinates = (position: XAndY): XAndY => {
        return {
            x: (position.x - this.position.x) * this.zoom + this.width / 2,
            y: (position.y - this.position.y) * this.zoom + this.height / 2
        };
    }

    toGlobalCoordinates = (ViewportRelativePos: XAndY): XAndY => ({
        x: (ViewportRelativePos.x - this.width / 2) / this.zoom + this.position.x,
        y: (ViewportRelativePos.y - this.height / 2) / this.zoom + this.position.y
    })

    zoomedViewportSize = (): XAndY => {
        return {
            x: this.width / this.zoom,
            y: this.height / this.zoom
        }
    }

    updateZoom = (newZoom: number, globalCoors: XAndY) => {
        newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
        // keep centerWorld stable on screen
        this.position.x = globalCoors.x - (globalCoors.x - this.position.x) * (this.zoom / newZoom);
        this.position.y = globalCoors.y - (globalCoors.y - this.position.y) * (this.zoom / newZoom);
        this.zoom = newZoom;
        this.interactionEvents.emit("viewportZoomed", this.zoom);
        this.interactionEvents.emit("viewportMoved", { x: this.position.x, y: this.position.y });
    }
}

export const addDraggableViewport = (app: Application, interactionevents: Emitter<GraphInteractionEvents>, containers: Container<DisplayObject>[]) => {
    const dragContainer = new Container();
    dragContainer.hitArea = new Rectangle(0, 0, app.screen.width, app.screen.height);

    const viewport = new Viewport(app.screen.width, app.screen.height, dragContainer, interactionevents);

    window.addEventListener("resize", _ =>
        setTimeout(() => viewport.resizeHitArea(app.screen.width, app.screen.height), 60));
    // timeout to let the app screen react first (hacky but oh well)
    // anyway, this will not work for programatically-driven changes of the canvas size - todo 

    dragContainer.sortableChildren = true;
    dragContainer.eventMode = 'static';
    dragContainer.cursor = 'grab';

    const activeTouches = new Map<number, XAndY>();
    let initialPinchDistance: number | null = null;
    let initialZoom = viewport.zoom;
    let pinchCenter: XAndY | null = null;

    const getDistance = (a: XAndY, b: XAndY) =>
        Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

    const clearPointer = (id: number) => {
        activeTouches.delete(id);
        if (activeTouches.size < 2) {
            initialPinchDistance = null;
            pinchCenter = null;
        }
        if (activeTouches.size === 0) viewport.dragged = false;
    };

    dragContainer.on('pointerdown', (e) => {
        if (!app.ticker.started) return;
        activeTouches.set(e.pointerId, { x: e.global.x, y: e.global.y });
        if (activeTouches.size === 1) viewport.dragged = true;
    });

    const pointerUpEvents = ['pointerup', 'pointerupoutside'];
    pointerUpEvents.forEach(ev => {
        dragContainer.on(ev, (e) => clearPointer(e.pointerId));
    });


    app.stage.on('pointermove', (e) => {
        if (!app.ticker.started) return;

        if (activeTouches.size === 1 && viewport.dragged) {
            viewport.moveByZoomed({ x: e.movementX, y: e.movementY });
            interactionevents.emit("viewportMoved", { x: viewport.position.x, y: viewport.position.y });
        }

        if (activeTouches.size === 2) {
            activeTouches.set(e.pointerId, { x: e.global.x, y: e.global.y });
            const [p1, p2] = [...activeTouches.values()];
            const dist = getDistance(p1, p2);

            if (initialPinchDistance === null) {
                initialPinchDistance = dist;
                initialZoom = viewport.zoom;
                pinchCenter = viewport.toGlobalCoordinates({
                    x: (p1.x + p2.x) / 2,
                    y: (p1.y + p2.y) / 2
                });
            } else if (pinchCenter) {
                const scale = dist / initialPinchDistance;
                viewport.updateZoom(initialZoom * scale, pinchCenter);
            }
        }
    });

    // Mouse wheel zoom toward mouse position
    dragContainer.on('wheel', (event) => {
        if (!app.ticker.started) return;
        event.preventDefault();
        event.stopPropagation();
        const worldCenter = viewport.toGlobalCoordinates({ x: event.globalX, y: event.globalY });
        const factor = event.deltaY < 0 ? ZOOM_STEP_MULTIPLICATOR_WHEEL : 1 / ZOOM_STEP_MULTIPLICATOR_WHEEL;
        viewport.updateZoom(viewport.zoom * factor, worldCenter);
    });

    return viewport;
};

