import { Emitter } from "mitt";
import { Application, Container, Rectangle } from "pixi.js";
import { XAndY } from "../../api/dataTypes";
import { InteractionEvents } from "../../api/events";
import { ZOOM_STEP_MULTIPLICATOR_WHEEL } from "../../core/defaultGraphOptions";
import { Viewport } from "./viewport";

export const addDraggableViewport = (app: Application, interactionevents: Emitter<InteractionEvents>, initialZoom?: number) => {
    const dragContainer = new Container();
    dragContainer.hitArea = new Rectangle(0, 0, app.screen.width, app.screen.height);

    const viewport = new Viewport(app.screen.width, app.screen.height, dragContainer, interactionevents, initialZoom);

    // window.addEventListener("resize", _ =>
    //     setTimeout(() => viewport.resizeHitArea(app.screen.width, app.screen.height), 60));
    // timeout to let the app screen react first (hacky but oh well)
    // anyway, this will not work for programatically-driven changes of the canvas size - todo 

    dragContainer.sortableChildren = true;
    dragContainer.eventMode = 'static';
    dragContainer.cursor = 'grab';

    const activeTouches = new Map<number, XAndY>();
    let initialPinchDistance: number | null = null;
    let lastZoom = viewport.zoom;
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
        viewport.lastPointerDownTimeStamp = Date.now();
        activeTouches.set(e.pointerId, { x: e.global.x, y: e.global.y });
        if (activeTouches.size === 1) viewport.dragged = true;
    });

    const pointerUpEvents = ['pointerup', 'pointerupoutside'];
    pointerUpEvents.forEach(ev => {
        dragContainer.on(ev, (e) => clearPointer(e.pointerId));
    });
    dragContainer.on('pointertap', (e) => {
        if (Date.now() - viewport.lastPointerDownTimeStamp > 120) return;

        const globalCoors = viewport.toGlobalCoordinates({ x: e.globalX, y: e.globalY });
        interactionevents.emit('backgroundClicked', globalCoors);
    });

    // safety fallback to prevent hardlock of the zoom/pan on mobile devices
    const handleGlobalPointerUp = (e: PointerEvent) => clearPointer(e.pointerId);
    viewport.registerWindowListener('pointerup', handleGlobalPointerUp);
    viewport.registerWindowListener('pointercancel', handleGlobalPointerUp);

    app.stage.on('pointermove', (e) => {
        if (!app.ticker.started) return;

        if (activeTouches.size === 1 && viewport.dragged) {
            const prev = activeTouches.get(e.pointerId);
            if (prev) {
                const dx = e.global.x - prev.x;
                const dy = e.global.y - prev.y;
                viewport.moveByZoomed({ x: dx, y: dy });
            }
            activeTouches.set(e.pointerId, { x: e.global.x, y: e.global.y });
            interactionevents.emit("viewportMoved", { x: viewport.position.x, y: viewport.position.y });
        }

        if (activeTouches.size === 2) {
            activeTouches.set(e.pointerId, { x: e.global.x, y: e.global.y });
            const [p1, p2] = [...activeTouches.values()];
            const dist = getDistance(p1, p2);

            if (initialPinchDistance === null) {
                initialPinchDistance = dist;
                lastZoom = viewport.zoom;
                pinchCenter = viewport.toGlobalCoordinates({
                    x: (p1.x + p2.x) / 2,
                    y: (p1.y + p2.y) / 2
                });
            } else if (pinchCenter) {
                const scale = dist / initialPinchDistance;
                viewport.updateZoom(lastZoom * scale, pinchCenter);
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