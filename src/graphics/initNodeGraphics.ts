import { TextStyle, Text, Sprite, MSAA_QUALITY, ColorMatrixFilter, Color } from "pixi.js";
import { getNodeProxy } from "../api/proxyNode";
import { DEFAULT_RADIUS, NODE_BORDER_THICKNESS, TEXT_BOX_NODE_WIDTH_MULTIPLIER, TEXT_WORD_WRAP_WIDTH, ZOOM_STEP_MULTIPLICATOR_WHEEL } from "../core/defaultGraphOptions";
import { RenderedNode } from "../core/renderedNode";
import { GraphStoresContainer } from "../state/storesContainer";
import { getBlinkSprite, getGlowSprite, getHollowHoleSprite, getHollowRimSprite } from "./sprites/effectSprites";
import { getNodeSprite } from "./sprites/nodeSprites";
import { TEXT_Z } from "./zIndexes";
import { NodeShape } from "../api/dataTypes";
import tinycolor from "tinycolor2";

export const initNodeGraphics = (node: RenderedNode, $states: GraphStoresContainer) => {
    const app = $states.graphics.app;

    node.sprite?.removeAllListeners();
    node.sprite?.destroy({ baseTexture: false, children: true, texture: false });
    node.isOnScreen = false;

    const sprite = getNodeSprite(app, node);
    sprite.tint = node.color;

    // $states.graphics.nodeContainer.addChild(sprite); -> handled in loader

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
    if (node.blinkEffect ){
        const blinkSprite = getBlinkSprite(app);
        sprite.addChild(blinkSprite);
        node.blinkingSprite = blinkSprite;
    }

    //interactivity
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';
    // sprite.cacheAsBitmap = true; 

    let holdStartTime = 0;

    sprite.on('globalpointermove', e => {
        const $graphics = $states.graphics;
        if (node.held && $graphics.app.ticker.started) {
            const zoom = $states.graphics.viewport.zoom;
            node.x += e.movementX / zoom;
            node.y += e.movementY / zoom;
            $states.interactionEvents.emit("nodeDragged", getNodeProxy(node, $states));
            // console.log(renderedNode.x, renderedNode.graphics.x);
        }
    });

    sprite.on('pointerdown', () => {
        if (!app.ticker.started) return;
        $states.simulation.frame = 0;
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
        const $graphics = $states.graphics;
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
            const nodeProxy = $states.context.proxyNodesMap.get(node);
            if (nodeProxy)
                $states.interactionEvents.emit("nodeClicked", nodeProxy);
            else
                console.error("Not initialized node proxy for node " + node.id);
        }
        node.held = false;
    }
    sprite.on('pointerup', handlePointerUp);
    sprite.on("pointerupoutside", handlePointerUp);
    // sprite.on("pointercancel", handlePointerUp);
    // text
    node.renderedText && node.renderedText.destroy({ children: true });

    node.renderedText = node.shape === NodeShape.TextBox
        ? getTextBoxText(node, $states.graphics.colorfulText)
        : getStandardNodeText(node, $states.graphics.colorfulText);

    // $states.graphics.textContainer.addChild(text); -> handled in loader
}


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
        stroke: "#000000",
    });

    const text = new Text(node.text, style);
    if (colorfulText) text.tint = new tinycolor(node.color).lighten(30).toString();
    text.anchor.set(0.5, 0);
    text.zIndex = TEXT_Z;

    return text;
}

const TEXT_BOX_MARGIN = 3;

const getTextBoxText = (node: RenderedNode, colorfulText?: boolean) => {

    const style = new TextStyle({
        breakWords: false,
        wordWrap: true,
        align: "left",
        fontFamily: 'Monospace',
        fontSize: 14,
        fill: 'white',
        wordWrapWidth: node.radius * 2 * TEXT_BOX_NODE_WIDTH_MULTIPLIER - 2 * (NODE_BORDER_THICKNESS * node.radius + TEXT_BOX_MARGIN),
        stroke: "#000000",
    });

    const text = new Text(node.text, style);
    if (colorfulText) text.tint = new tinycolor(node.color).lighten(30).toString();
    text.anchor.set(0.5, 0);
    text.zIndex = TEXT_Z;

    return text;
}