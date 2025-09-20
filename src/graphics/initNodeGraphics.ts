import { TextStyle, Text } from "pixi.js";
import { getNodeProxy } from "../api/proxyNode";
import { DEFAULT_RADIUS, TEXT_WORD_WRAP, ZOOM_STEP_MULTIPLICATOR_WHEEL } from "../core/defaultGraphOptions";
import { RenderedNode } from "../core/renderedNode";
import { GraphStoresContainer } from "../state/storesContainer";
import { getGlowSprite, getHollowHoleSprite, getHollowRimSprite } from "./sprites/effectSprites";
import { getNodeSprite } from "./sprites/nodeSprites";
import { TEXT_Z } from "./zIndexes";

export const initNodeGraphics = (node: RenderedNode, $states: GraphStoresContainer) => {
    const app = $states.graphics.get().app;

    node.sprite?.removeAllListeners();
    node.sprite?.destroy({ baseTexture: false, children: true, texture: false });
    node.isOnScreen = false;

    const sprite = getNodeSprite(app, node);
    sprite.tint = node.color;

    // $states.graphics.get().nodeContainer.addChild(sprite); -> handled in loader

    node.sprite = sprite;

    if (node.glowEffect) {
        const glow = getGlowSprite(app);
        glow.tint = node.color;
        sprite.addChild(glow);
    }
    if (node.hollowEffect) {
        const hole = getHollowHoleSprite(app);
        sprite.addChild(hole);
        const rim = getHollowRimSprite(app);
        rim.tint = node.color;
        sprite.addChild(rim);
    }

    //interactivity
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';
    // sprite.cacheAsBitmap = true; 

    let holdStartTime = 0;

    sprite.on('globalpointermove', e => {
        const $graphics = $states.graphics.get();
        if (node.held && $graphics.app.ticker.started) {
            const zoom = $states.graphics.get().viewport.zoom;
            node.x += e.movementX / zoom;
            node.y += e.movementY / zoom;
            $states.interactionEvents.emit("nodeDragged", getNodeProxy(node, $states));
            // console.log(renderedNode.x, renderedNode.graphics.x);
        }
    });

    sprite.on('pointerdown', () => {
        if (!app.ticker.started) return;
        $states.simulation.setKey("frame", 0);
        node.held = true;
        holdStartTime = performance.now();
    });

    sprite.on('pointerover', () => {
        if (!app.ticker.started) return;
        node.hovered = true;
    });
    sprite.on('pointerout', () => {
        // if (!app.ticker.started) return; //I think leaving this condition here is reasonable
        node.hovered = false;
    });
    sprite.on('wheel', (e) => {
        const $graphics = $states.graphics.get();
        if (!$graphics.app.ticker.started) return;
        e.preventDefault();
        e.stopPropagation();
        const worldCenter = $graphics.viewport.toGlobalCoordinates({ x: e.globalX, y: e.globalY });
        const factor = e.deltaY < 0 ? ZOOM_STEP_MULTIPLICATOR_WHEEL : 1 / ZOOM_STEP_MULTIPLICATOR_WHEEL;
        $graphics.viewport.updateZoom($graphics.viewport.zoom * factor, worldCenter);
    });

    // opens the node if the click was short

    const handlePointerUp = () => {
        const DRAG_TIME_THRESHOLD = 200;

        if (node.held && performance.now() - holdStartTime < DRAG_TIME_THRESHOLD
            && app.ticker.started) {
            const nodeProxy = $states.context.get().proxyNodesMap.get(node);
            if (nodeProxy)
                $states.interactionEvents.emit("nodeClicked", nodeProxy);
            else
                console.error("Not initialized node proxy for node " + node.id);
            // setTimeout(() => thoughtClicked(thought.id), 30); //timeout to prevent overlay from registering the click too
        }
        node.held = false;
    }
    sprite.on('pointerup', handlePointerUp);
    sprite.on("pointerupoutside", handlePointerUp);
    // sprite.on("pointercancel", handlePointerUp);
    // text
    node.text && node.text.destroy({children: true});

    const style = new TextStyle({
        breakWords: false,
        wordWrap: true,
        align: "center",
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'bold',
        fill: 'white',
        wordWrapWidth: TEXT_WORD_WRAP,
        stroke: "#000000",
        // dropShadow: true,
        // dropShadowDistance: 2,
    });

    const text = new Text(node.title, style);
    text.zIndex = TEXT_Z;
    text.x = node.x - text.width / 2;
    text.y = node.y - text.height / 2 + text.height / 2 + DEFAULT_RADIUS + 5;
    node.text = text;

    // $states.graphics.get().textContainer.addChild(text); -> handled in loader
}