import { TextStyle, Text, Container } from "pixi.js";
import { getNodeProxy } from "../api/proxyNode";
import { NODE_BORDER_THICKNESS, TEXT_WORD_WRAP_WIDTH, ZOOM_STEP_MULTIPLICATOR_WHEEL } from "../core/defaultGraphOptions";
import { RenderedNode } from "../core/renderedNode";
import { GraphStoresContainer } from "../state/storesContainer";
import { getBlinkSprite, getGlowSprite, getHollowHoleSprite, getHollowRimSprite } from "./sprites/effectSprites";
import { getNodeSprite } from "./sprites/nodeSprites";
import { TEXT_Z } from "./zIndexes";
import { NodeShape } from "../api/dataTypes";
import tinycolor from "tinycolor2";

export const initNodeGraphics = (node: RenderedNode, $states: GraphStoresContainer) => {
    const app = $states.graphics.app;
    const textureCache = $states.graphics.spriteTextures;
    if ($states.debug.logToConsole) console.log("initializing node " + node.id);

    node.sprite?.removeAllListeners();
    node.sprite?.destroy({ children: true });
    node.isLoadedOnScreen = false;

    // baseSprite is purely visual — the container handles interaction
    const baseSprite = getNodeSprite(app, textureCache, node);
    baseSprite.eventMode = 'none';
    if (node.shape === NodeShape.TextOnly || node.shape === NodeShape.TextOnlyHighlighted) {
        baseSprite.alpha = 0;
    } else {
        baseSprite.tint = node.color;
    }

    // Container owns the transform each frame and is the interactive element
    const container = new Container();
    container.hitArea = baseSprite.hitArea;
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.addChild(baseSprite);

    if (node.glowEffect) {
        const glow = getGlowSprite(app, textureCache);
        glow.tint = node.color;
        container.addChild(glow);
    }
    if (node.hollowEffect) {
        const hole = getHollowHoleSprite(app, textureCache);
        container.addChild(hole);
        const rim = getHollowRimSprite(app, textureCache);
        rim.tint = node.color;
        container.addChild(rim);
    }
    if (node.blinkEffect) {
        const blinkSprite = getBlinkSprite(app, textureCache);
        container.addChild(blinkSprite);
        node.blinkingSprite = blinkSprite;
    }

    node.sprite = container;

    let holdStartTime = 0;

    container.on('globalpointermove', e => {
        const $graphics = $states.graphics;
        if (node.held && $graphics.app.ticker.started) {
            const zoom = $states.graphics.viewport.zoom;
            node.x += e.movementX / zoom;
            node.y += e.movementY / zoom;
            $states.interactionEvents.emit("nodeDragged", getNodeProxy(node, $states));
        }
    });

    container.on('pointerdown', () => {
        if (!app.ticker.started) return;
        $states.simulation.frame = 0;
        node.held = true;
        holdStartTime = performance.now();
    });

    container.on('pointerover', () => {
        if (!app.ticker.started) return;
        node.hovered = true;
    });
    container.on('pointerout', () => {
        node.hovered = false;
    });
    container.on('wheel', (e) => {
        const $graphics = $states.graphics;
        if (!$graphics.app.ticker.started) return;
        e.stopPropagation();
        const worldCenter = $graphics.viewport.toGlobalCoordinates({ x: e.globalX, y: e.globalY });
        const factor = e.deltaY < 0 ? ZOOM_STEP_MULTIPLICATOR_WHEEL : 1 / ZOOM_STEP_MULTIPLICATOR_WHEEL;
        $graphics.viewport.updateZoom($graphics.viewport.zoom * factor, worldCenter);
    });

    const handlePointerUp = () => {
        const DRAG_TIME_THRESHOLD = 200;

        if (node.held && performance.now() - holdStartTime < DRAG_TIME_THRESHOLD
            && app.ticker.started) {
            const nodeProxy = $states.context.proxyNodesMap.get(node);
            if (nodeProxy)
                $states.interactionEvents.emit("nodeClicked", nodeProxy);
            else
                console.error("Not initialized node proxy for node " + node.id);
        }
        node.held = false;
    }
    container.on('pointerup', handlePointerUp);
    container.on("pointerupoutside", handlePointerUp);

    // text — created lazily in handleNodeLoading, not here
    node.renderedText && node.renderedText.destroy({ children: true });
    node.renderedText = undefined;
    node.isTextLoadedOnScreen = false;

    // $states.graphics.textContainer.addChild(text); -> handled in loader
}


export const createRenderedText = (node: RenderedNode, colorfulText: boolean): Text =>
    (node.shape === NodeShape.TextOnly || node.shape === NodeShape.TextOnlyHighlighted)
        ? getTextBoxText(node, colorfulText, node.shape === NodeShape.TextOnlyHighlighted)
        : getStandardNodeText(node, colorfulText);

const getStandardNodeText = (node: RenderedNode, colorfulText?: boolean) => {

    const style = new TextStyle({
        breakWords: false,
        wordWrap: true,
        align: "center",
        fontFamily: 'Monospace',
        fontSize: 14,
        fontWeight: "bold",
        fill: '#ffffff',
        wordWrapWidth: TEXT_WORD_WRAP_WIDTH,
        stroke: { color: "#000000", width: 2 }
    });

    const text = new Text({ text: node.text, style });
    if (colorfulText) text.tint = new tinycolor(node.color).lighten(30).toString();
    text.anchor.set(0.5, 0);
    text.zIndex = TEXT_Z;

    return text;
}

const getTextBoxText = (node: RenderedNode, colorfulText?: boolean, highlighted?: boolean) => {

    const style = new TextStyle({
        breakWords: true,
        wordWrap: true,
        align: "left",
        fontFamily: 'Monospace',
        fontSize: 30,
        fill: 'white',
        dropShadow: highlighted ? { blur: 4, color: 'white', distance: 0 } : undefined,
        wordWrapWidth: node.radius * 3
    });

    const text = new Text({ text: node.text, style });
    if (colorfulText) text.tint = new tinycolor(node.color).lighten(30).toString();
    text.anchor.set(0.5);
    text.zIndex = TEXT_Z;

    return text;
}
