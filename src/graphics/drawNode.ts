import tinycolor from "tinycolor2";
import { NodeShape, NodeEffect } from "../api/graphNode";
import { THOUGHT_BORDER_THICKNESS } from "../core/defaultGraphOptions";
import { GraphStoresContainer } from "../state/storesContainer";
import { RenderedNode } from "./renderedNode";

export const drawNode = (node: RenderedNode, $states: GraphStoresContainer) => {
    // const graphState = useGraphStore.getState();
    const $simState = $states.simulation.get();
    const $graphicsState = $states.graphics.get();

    const TimeAffectedRadius = node.radius
    //  * (1 - THOUGHT_BORDER_THICKNESS / 2))                           TODO - this is another dynamic effect - move this logic into the runner along with blinking and use scale of the Graphics
    //     * (thought.timeOnScreen < NEW_NODE_INVISIBLE_FOR ? 0 :
    //         Math.min(1, (thought.timeOnScreen - NEW_NODE_INVISIBLE_FOR) / NEW_NODE_FADE_IN_FRAMES)
    //     ); 

    if (node.graphics === undefined) {
        console.log("warning: attempted to render thought with unanitialized graphics")
        return;
    }
    const nodeGraphics = node.graphics!

    // circle.clear();
    // const stateViewport = graphState.viewport;
    // if the node is out of screen, don't draw it
    // const circleCoors = stateViewport.toViewportCoordinates({ x: thought.position.x, y: thought.position.y });
    // if (circleCoors.x < -thought.radius * graphState.viewport.zoom || circleCoors.x > stateViewport.width + thought.radius * graphState.viewport.zoom
    //     || circleCoors.y < -thought.radius * graphState.viewport.zoom || circleCoors.y > stateViewport.height + thought.radius * graphState.viewport.zoom) {
    //     circle.clear();
    //     return;
    // }
    // console.log("last zoom: " , + lastZoom + " zoom: " + graphState.viewport.zoom);

    nodeGraphics.clear();
    const opacity = 1; //Math.min(1, (thought.timeOnScreen - NEW_NODE_INVISIBLE_FOR) / NEW_NODE_FADE_IN_FRAMES);



    // Blinking is a dynamic effect - it has to be dealt with inside the main render fnction (some kind of overlay?)
    // instead of dealing with it here...

    // const pulsingColor = $simState.frame % 150 < 50 &&
    //     node.effects.includes(NodeEffect.Blinking)
    //     ? tinycolor(node.color).lighten(30 - ($simState.frame % 50) / 50 * 30).toString()
    //     : node.color;


    const thoughtLineStyle = { width: node.radius * THOUGHT_BORDER_THICKNESS, color: tinycolor(node.color).lighten(20).toString(), alpha: opacity };

    // : { width: thought.radius * 0.1 * stateViewport.zoom, color: getSelectedColorHex(thought.selectedColor), alpha: opacity }
    const thoughtFillStyle = { color: node.color, alpha: opacity };


    nodeGraphics.beginFill(tinycolor(thoughtFillStyle.color).lighten(5).toString(), thoughtFillStyle.alpha);
    nodeGraphics.lineStyle(thoughtLineStyle);

    if (nodeGraphics.children.length == 0)
        switch (node.shape) {
            case NodeShape.Circle:
                nodeGraphics.drawCircle(0, 0, TimeAffectedRadius);
                break;
            case NodeShape.Square:
                nodeGraphics.drawRoundedRect(
                    - TimeAffectedRadius / 3 * 2, - TimeAffectedRadius / 3 * 2,
                    TimeAffectedRadius * 4 / 3, TimeAffectedRadius * 4 / 3, TimeAffectedRadius / 3
                );
                break;
            case NodeShape.UpTriangle:
                nodeGraphics.moveTo(0, 0 - TimeAffectedRadius);
                nodeGraphics.lineTo(0 - TimeAffectedRadius * Math.sqrt(3) / 2, 0 + TimeAffectedRadius / 2);
                nodeGraphics.lineTo(0 + TimeAffectedRadius * Math.sqrt(3) / 2, 0 + TimeAffectedRadius / 2);
                nodeGraphics.lineTo(0, 0 - TimeAffectedRadius);
                // circle.lineStyle(thoughtLineStyle.width / 2, thoughtLineStyle.color, thoughtLineStyle.alpha, 1);
                // circle.drawCircle(0, 0 - thought.radius, thoughtLineStyle.width / 4 );
                break;

            case NodeShape.DownTriangle:
                nodeGraphics.moveTo(0, 0 + TimeAffectedRadius);
                nodeGraphics.lineTo(0 - TimeAffectedRadius * Math.sqrt(3) / 2, 0 - TimeAffectedRadius / 2);
                nodeGraphics.lineTo(0 + TimeAffectedRadius * Math.sqrt(3) / 2, 0 - TimeAffectedRadius / 2);
                nodeGraphics.lineTo(0, 0 + TimeAffectedRadius);
                break;

            case NodeShape.Diamond:
                nodeGraphics.lineStyle();
                nodeGraphics.endFill();
                // circle.moveTo(0 - thought.radius * 2 / 16 , 0 - (thought.radius * 14 / 16));
                nodeGraphics.moveTo(0, 0 - TimeAffectedRadius);
                nodeGraphics.arcTo(0 - TimeAffectedRadius, 0, 0, 0 + TimeAffectedRadius, TimeAffectedRadius / 3);
                nodeGraphics.beginFill(thoughtFillStyle.color, thoughtFillStyle.alpha);
                nodeGraphics.lineStyle(thoughtLineStyle);
                nodeGraphics.arcTo(0, 0 + TimeAffectedRadius, 0 + TimeAffectedRadius, 0, TimeAffectedRadius / 3);
                nodeGraphics.arcTo(0 + TimeAffectedRadius, 0, 0, 0 - TimeAffectedRadius, TimeAffectedRadius / 3);
                nodeGraphics.arcTo(0, 0 - TimeAffectedRadius, 0 - TimeAffectedRadius, 0, TimeAffectedRadius / 3);
                nodeGraphics.arcTo(0 - TimeAffectedRadius, 0, 0, 0 + TimeAffectedRadius, TimeAffectedRadius / 3);
                break;
            case NodeShape.Cross:
                nodeGraphics.lineStyle();
                nodeGraphics.beginFill(thoughtLineStyle.color);
                const gridSize = TimeAffectedRadius / 7 * 3;
                const smallerGridSize = gridSize * 0.5;

                nodeGraphics.moveTo(0, 0 - gridSize);
                nodeGraphics.lineTo(0 - gridSize, 0 - gridSize * 2);
                nodeGraphics.lineTo(0 - gridSize * 2, 0 - gridSize);
                nodeGraphics.lineTo(0 - gridSize, 0);
                nodeGraphics.lineTo(0 - gridSize * 2, 0 + gridSize);
                nodeGraphics.lineTo(0 - gridSize, 0 + gridSize * 2);
                nodeGraphics.lineTo(0, 0 + gridSize);
                nodeGraphics.lineTo(0 + gridSize, 0 + gridSize * 2);
                nodeGraphics.lineTo(0 + gridSize * 2, 0 + gridSize);
                nodeGraphics.lineTo(0 + gridSize, 0);
                nodeGraphics.lineTo(0 + gridSize * 2, 0 - gridSize);
                nodeGraphics.lineTo(0 + gridSize, 0 - gridSize * 2);
                nodeGraphics.lineTo(0, 0 - gridSize);
                nodeGraphics.endFill();

                nodeGraphics.moveTo(0, 0 - smallerGridSize);
                nodeGraphics.beginFill(thoughtFillStyle.color);
                nodeGraphics.lineTo(0 - smallerGridSize, 0 - smallerGridSize * 2);
                nodeGraphics.lineTo(0 - smallerGridSize * 2, 0 - smallerGridSize);
                nodeGraphics.lineTo(0 - smallerGridSize, 0);
                nodeGraphics.lineTo(0 - smallerGridSize * 2, 0 + smallerGridSize);
                nodeGraphics.lineTo(0 - smallerGridSize, 0 + smallerGridSize * 2);
                nodeGraphics.lineTo(0, 0 + smallerGridSize);
                nodeGraphics.lineTo(0 + smallerGridSize, 0 + smallerGridSize * 2);
                nodeGraphics.lineTo(0 + smallerGridSize * 2, 0 + smallerGridSize);
                nodeGraphics.lineTo(0 + smallerGridSize, 0);
                nodeGraphics.lineTo(0 + smallerGridSize * 2, 0 - smallerGridSize);
                nodeGraphics.lineTo(0 + smallerGridSize, 0 - smallerGridSize * 2);
                nodeGraphics.lineTo(0, 0 - smallerGridSize);
                break;

            case NodeShape.Heart:
                const r = TimeAffectedRadius;
                const yOffset = TimeAffectedRadius * 0.3;
                nodeGraphics.beginFill(thoughtFillStyle.color, thoughtFillStyle.alpha);
                nodeGraphics.lineStyle(thoughtLineStyle);

                nodeGraphics.moveTo(0, r * 0.6 + yOffset);
                nodeGraphics.bezierCurveTo(-r * 1.7, r * -0.25 + yOffset, -r * 0.93, -r * 1.75 + yOffset, 0, -r * 0.8 + yOffset);
                nodeGraphics.bezierCurveTo(r * 0.93, -r * 1.75 + yOffset, r * 1.7, r * -0.25 + yOffset, 0, r * 0.6 + yOffset);

                nodeGraphics.endFill();
                break;
            default:
                nodeGraphics.drawCircle(0, 0, TimeAffectedRadius);
                break;
        }
    nodeGraphics.endFill();



    if (node.effects.includes(NodeEffect.Hollow)) {
        nodeGraphics.beginFill("black", 1);
        nodeGraphics.lineStyle(node.radius * 0.1, tinycolor(node.color).lighten(15).toString(), 1);
        nodeGraphics.drawCircle(0, 0, (TimeAffectedRadius * 0.5));
        nodeGraphics.endFill();
    }
    // else {
    //     // const explorableLowestTimeOnScreen = onScreenThoughts
    //     //     .filter(t => thought.links.includes(t.id) || thought.backlinks.includes(t.id))
    //     //     .map(t => t.timeOnScreen)
    //     //     .reduce((min, cur) => Math.min(min, cur), Number.MAX_SAFE_INTEGER);

    //     // const blackDotOpacity = explorableLowestTimeOnScreen > NEW_NODE_INVISIBLE_FOR
    //     //     ? 0
    //     //     : Math.min(1, (thought.timeOnScreen - NEW_NODE_INVISIBLE_FOR) / NEW_NODE_FADE_IN_FRAMES);

    //     // circle.beginFill("black", blackDotOpacity);
    //     // circle.lineStyle(thought.radius * 0.1 * stateViewport.zoom, tinycolor(thought.color).lighten(15).toString(), blackDotOpacity);
    //     // circle.drawCircle(circleCoors.x, circleCoors.y, stateViewport.zoom * (TimeAffectedRadius * 0.5));
    //     // circle.endFill();
    // }

    // muffins!

    // (async () => {
    //     const muffinTexture = new Sprite(muffinSvg as Texture);;
    //     muffinTexture.width = (thought.radius * 2) * stateViewport.zoom;
    //     muffinTexture.height = (thought.radius * 2) * stateViewport.zoom;
    //     muffinTexture.position.set((circleCoors.x - muffinTexture.width / 2), (circleCoors.y - muffinTexture.height / 2));
    //     muffinTexture.interactive = false;

    //     circle.removeChildren();
    //     circle.addChild(muffinTexture);
    // })();

    // texture approach
    // (async () => {
    //     if (circle.children.length > 0)
    //         return;
    //     const nodeTexture = new Sprite(thoughtNode as Texture);
    //     nodeTexture.width = (thought.radius * 2) * stateViewport.zoom;
    //     nodeTexture.height = (thought.radius * 2) * stateViewport.zoom;
    //     nodeTexture.position.set(- nodeTexture.width / 2,  - nodeTexture.height / 2);
    //     nodeTexture.interactive = false;

    //     circle.removeChildren();
    //     circle.addChild(nodeTexture);
    // })();

    //graphics approach
    // (async () => {
    //     if (circle.children.length > 0)
    //         return;
    //     const nodeTexture = new Sprite(thoughtNode as Texture);
    //     nodeTexture.width = (thought.radius * 2) * stateViewport.zoom;
    //     nodeTexture.height = (thought.radius * 2) * stateViewport.zoom;
    //     nodeTexture.position.set(- nodeTexture.width / 2,  - nodeTexture.height / 2);
    //     nodeTexture.interactive = false;

    //     circle.removeChildren();
    //     circle.addChild(nodeTexture);
    // })();

    // const scale = graphState.viewport.zoom * thought.radius / 2;
    // circle.scale = { x: scale, y: scale };

    if (node.effects.includes(NodeEffect.Aura)) {
        nodeGraphics.lineStyle(500, node.color, 0.05);
        nodeGraphics.drawCircle(0, 0, (TimeAffectedRadius + 400));

        nodeGraphics.lineStyle(400, node.color, 0.05);
        nodeGraphics.drawCircle(0, 0, (TimeAffectedRadius + 350));

        nodeGraphics.lineStyle(300, node.color, 0.05);
        nodeGraphics.drawCircle(0, 0, (TimeAffectedRadius + 300));

        nodeGraphics.lineStyle(200, node.color, 0.05);
        nodeGraphics.drawCircle(0, 0, (TimeAffectedRadius + 250));

        nodeGraphics.lineStyle(100, node.color, 0.2);
        nodeGraphics.drawCircle(0, 0, (TimeAffectedRadius + 200));
    }
    // if (thought.size <= 3) {
    //     circle.lineStyle(0);
    //     circle.beginFill("#000000", 0.001);//this is here only to make the hit area bigger
    //     circle.drawCircle(circleCoors.x, circleCoors.y, stateViewport.zoom * TimeAffectedRadius + 8);
    //     circle.endFill();
    // }
}