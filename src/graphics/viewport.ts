import { Application, Container, DisplayObject, Rectangle } from "pixi.js";
import { INITIAL_ZOOM, GRAVITY_FREE_RADIUS, MIN_ZOOM, ZOOM_STEP_MULTIPLICATOR_BUTTONS, MAX_ZOOM, ZOOM_STEP_MULTIPLICATOR_WHEEL } from "../core/defaultGraphOptions";
import { XAndY } from "../core/innerTypes";
import { GraphStoresContainer } from "../state/storesContainer";
import { GraphCallbacks } from "../api/controlTypes";


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

    dragContainer: Container;

    constructor(width: number, height: number, dragContainer: Container) {
        this.height = height;
        this.width = width;
        this.zoom = INITIAL_ZOOM;
        this.position = { x: 0, y: 0 };
        this.dragged = false;
        this.lockedOnNode = false;
        this.dragContainer = dragContainer;
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

    //Used for zooming by buttons
    public zoomByButtonDelta(dir: number) {
        // const oldBottomRight: XAndY = { x: this.position.x + this.zoomedViewportSize().x, y: this.position.y + this.zoomedViewportSize().y };

        if (dir < 0 && this.zoom > MIN_ZOOM)
            this.zoom /= ZOOM_STEP_MULTIPLICATOR_BUTTONS;
        if (dir > 0 && this.zoom < MAX_ZOOM)
            this.zoom *= ZOOM_STEP_MULTIPLICATOR_BUTTONS;

        // const newBottomRight: XAndY = { x: this.position.x + this.zoomedViewportSize().x, y: this.position.y + this.zoomedViewportSize().y };

        // this.moveBy({ x: -(oldBottomRight.x - newBottomRight.x) / 2, y: -(oldBottomRight.y - newBottomRight.y) * 2 / 3});
    }

    //used for zoom by mouse wheel
    public zoomByWheelDelta(dir: number) {
        // const oldBottomRight: XAndY = { x: this.position.x + this.zoomedViewportSize().x, y: this.position.y + this.zoomedViewportSize().y };
        if (dir < 0 && this.zoom > MIN_ZOOM)
            this.zoom /= ZOOM_STEP_MULTIPLICATOR_WHEEL;
        if (dir > 0 && this.zoom < MAX_ZOOM)
            this.zoom *= ZOOM_STEP_MULTIPLICATOR_WHEEL;

        // const newBottomRight: XAndY = { x: this.position.x + this.zoomedViewportSize().x, y: this.position.y + this.zoomedViewportSize().y };

        // this.moveBy({ x: -(oldBottomRight.x - newBottomRight.x) / 2, y: -(oldBottomRight.y - newBottomRight.y) * 2 / 3 });
    }

    toViewportCoordinates = (position: XAndY): XAndY => {
        return {
            x: (position.x - this.position.x) * this.zoom + this.width / 2,
            y: (position.y - this.position.y) * this.zoom + this.height / 2
        };
    }

    zoomedViewportSize = (): XAndY => {
        return {
            x: this.width / this.zoom,
            y: this.height / this.zoom
        }
    }

}

// todo: this method was completely re-written by AI - check it thoroughly

export const addDraggableViewport = (viewportSize: XAndY, app: Application, hooks: GraphCallbacks, containers: Container<DisplayObject>[]) => {
    const dragContainer = new Container();
    const viewport = new Viewport(viewportSize.x, viewportSize.y, dragContainer);

    dragContainer.hitArea = new Rectangle(0, 0, viewportSize.x, viewportSize.y);

    dragContainer.sortableChildren = true;
    dragContainer.eventMode = 'static';
    dragContainer.cursor = 'grab';

    const activeTouches = new Map<number, XAndY>();
    let initialPinchDistance: number | null = null;
    let initialZoom = viewport.zoom;
    let pinchCenter: XAndY | null = null;

    const getDistance = (a: XAndY, b: XAndY) =>
        Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

    const globalToWorld = (g: XAndY): XAndY => ({
        x: (g.x - viewport.width / 2) / viewport.zoom + viewport.position.x,
        y: (g.y - viewport.height / 2) / viewport.zoom + viewport.position.y
    });

    const updateZoom = (newZoom: number, centerWorld: XAndY) => {
        newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
        // keep centerWorld stable on screen
        viewport.position.x = centerWorld.x - (centerWorld.x - viewport.position.x) * (viewport.zoom / newZoom);
        viewport.position.y = centerWorld.y - (centerWorld.y - viewport.position.y) * (viewport.zoom / newZoom);
        viewport.zoom = newZoom;
        hooks.onViewportZoomed?.(viewport.zoom);
        hooks.onViewportMoved?.(viewport.position.x, viewport.position.y);
    };

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

        // containers.forEach(c => c.interactiveChildren = false);
        // if (activeTouches.size >= 1) {
        //     // multi touch starting, temporarily disable node interactivity
        //     nodesContainer.interactiveChildren = false;
        // }
    });

    const pointerUpEvents = ['pointerup', 'pointerupoutside', 'pointercancel', 'pointerout', 'pointerleave'];
    pointerUpEvents.forEach(ev => {
        dragContainer.on(ev, (e) => clearPointer(e.pointerId))
        // if (activeTouches.size === 0)
        //     containers.forEach(c => c.interactiveChildren = true);
    }
    );

    dragContainer.on('pointermove', (e) => {
        if (!app.ticker.started) return;

        if (activeTouches.size === 1 && viewport.dragged) {
            viewport.moveByZoomed({ x: e.movementX, y: e.movementY });
            hooks.onViewportMoved?.(viewport.position.x, viewport.position.y);
        }

        if (activeTouches.size === 2) {
            activeTouches.set(e.pointerId, { x: e.global.x, y: e.global.y });
            const [p1, p2] = [...activeTouches.values()];
            const dist = getDistance(p1, p2);

            if (initialPinchDistance === null) {
                initialPinchDistance = dist;
                initialZoom = viewport.zoom;
                pinchCenter = globalToWorld({
                    x: (p1.x + p2.x) / 2,
                    y: (p1.y + p2.y) / 2
                });
            } else if (pinchCenter) {
                const scale = dist / initialPinchDistance;
                updateZoom(initialZoom * scale, pinchCenter);
            }
        }
    });

    // Mouse wheel zoom toward mouse position
    dragContainer.on('wheel', (event) => {
        if (!app.ticker.started) return;
        event.preventDefault();
        event.stopPropagation();
        const worldCenter = globalToWorld({ x: event.globalX, y: event.globalY });
        const factor = event.deltaY < 0 ? ZOOM_STEP_MULTIPLICATOR_WHEEL : 1 / ZOOM_STEP_MULTIPLICATOR_WHEEL;
        updateZoom(viewport.zoom * factor, worldCenter);
    });

    return viewport;
};

