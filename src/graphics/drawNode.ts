import tinycolor from "tinycolor2";
import { NodeShape } from "../api/dataTypes";
import { THOUGHT_BORDER_THICKNESS } from "../core/defaultGraphOptions";
import { GraphStoresContainer } from "../state/storesContainer";
import { RenderedNode } from "../core/renderedNode";
import { Graphics, IFillStyleOptions, ILineStyleOptions } from "pixi.js";

export const drawNode = (node: RenderedNode, $states: GraphStoresContainer) => {
    // const graphState = useGraphStore.getState();
    // const $simState = $states.simulation.get();
    // const $graphicsState = $states.graphics.get();


    //  * (1 - THOUGHT_BORDER_THICKNESS / 2))                           TODO - this is another dynamic effect - move this logic into the runner along with blinking and use scale of the Graphics
    //     * (thought.timeOnScreen < NEW_NODE_INVISIBLE_FOR ? 0 :
    //         Math.min(1, (thought.timeOnScreen - NEW_NODE_INVISIBLE_FOR) / NEW_NODE_FADE_IN_FRAMES)
    //     ); 

    if (node.graphics === undefined) {
        console.log("warning: attempted to render thought with unanitialized graphics")
        return;
    }
    const nodeGraphics = node.graphics;

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



    // Blinking is a dynamic effect - it has to be dealt with inside the main render fnction (some kind of overlay?)
    // instead of dealing with it here...

    // const pulsingColor = $simState.frame % 150 < 50 &&
    //     node.effects.includes(NodeEffect.Blinking)
    //     ? tinycolor(node.color).lighten(30 - ($simState.frame % 50) / 50 * 30).toString()
    //     : node.color;


    const thoughtLineStyle = { width: node.radius * THOUGHT_BORDER_THICKNESS, color: tinycolor(node.color).lighten(20).toString(), alpha: 1 };

    // : { width: thought.radius * 0.1 * stateViewport.zoom, color: getSelectedColorHex(thought.selectedColor), alpha: opacity }

    drawShape(nodeGraphics, node.shape, node.radius, thoughtLineStyle, node.color);

    if (node.blinkEffect) {
        node.graphics.addChild(node.blinkingGraphics);
        drawShape(node.blinkingGraphics, node.shape, node.radius * 9 / 10, thoughtLineStyle, "#ffffff"); //todo - add blinking color as a parameter to GraphNode
    } else {
        node.graphics.removeChildren();
    }

    if (node.hollowEffect) {
        nodeGraphics.beginFill($states.graphics.get().app.renderer.background.backgroundColor.toHex(), 1);
        nodeGraphics.lineStyle(node.radius * 0.1, tinycolor(node.color).lighten(15).toString(), 1);
        nodeGraphics.drawCircle(0, 0, (node.radius * 0.5));
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

    if (node.glowEffect) {
        nodeGraphics.lineStyle(500, node.color, 0.05);
        nodeGraphics.drawCircle(0, 0, (node.radius + 400));

        nodeGraphics.lineStyle(400, node.color, 0.05);
        nodeGraphics.drawCircle(0, 0, (node.radius + 350));

        nodeGraphics.lineStyle(300, node.color, 0.05);
        nodeGraphics.drawCircle(0, 0, (node.radius + 300));

        nodeGraphics.lineStyle(200, node.color, 0.05);
        nodeGraphics.drawCircle(0, 0, (node.radius + 250));

        nodeGraphics.lineStyle(100, node.color, 0.2);
        nodeGraphics.drawCircle(0, 0, (node.radius + 200));
    }

    //this is here only to make the hit area bigger (helps with grabbing/clicking on small nodes)
    nodeGraphics.lineStyle(0);
    nodeGraphics.beginFill("#000000", 0.001);
    nodeGraphics.drawCircle(0, 0, node.radius + 10);
    nodeGraphics.endFill();
}



const drawShape = (graphics: Graphics, shape: NodeShape, radius: number, lineStyle: ILineStyleOptions, fillColor: string, alpha: number = 1) => {

    graphics.beginFill(tinycolor(fillColor).lighten(5).toString(), alpha);
    graphics.lineStyle(lineStyle);

    switch (shape) {
        case NodeShape.Circle:
            graphics.drawCircle(0, 0, radius);
            break;
        case NodeShape.Square:
            graphics.drawRoundedRect(
                - radius / 3 * 2, - radius / 3 * 2,
                radius * 4 / 3, radius * 4 / 3, radius / 3
            );
            break;
        case NodeShape.UpTriangle:
            graphics.moveTo(0, 0 - radius);
            graphics.lineTo(0 - radius * Math.sqrt(3) / 2, 0 + radius / 2);
            graphics.lineTo(0 + radius * Math.sqrt(3) / 2, 0 + radius / 2);
            graphics.lineTo(0, 0 - radius);
            // circle.lineStyle(thoughtLineStyle.width / 2, thoughtLineStyle.color, thoughtLineStyle.alpha, 1);
            // circle.drawCircle(0, 0 - thought.radius, thoughtLineStyle.width / 4 );
            break;

        case NodeShape.DownTriangle:
            graphics.moveTo(0, 0 + radius);
            graphics.lineTo(0 - radius * Math.sqrt(3) / 2, 0 - radius / 2);
            graphics.lineTo(0 + radius * Math.sqrt(3) / 2, 0 - radius / 2);
            graphics.lineTo(0, 0 + radius);
            break;

        case NodeShape.Diamond:
            graphics.lineStyle();
            graphics.endFill();
            // circle.moveTo(0 - thought.radius * 2 / 16 , 0 - (thought.radius * 14 / 16));
            graphics.moveTo(0, 0 - radius);
            graphics.arcTo(0 - radius, 0, 0, 0 + radius, radius / 3);
            graphics.beginFill(fillColor, alpha);
            graphics.lineStyle(lineStyle);
            graphics.arcTo(0, 0 + radius, 0 + radius, 0, radius / 3);
            graphics.arcTo(0 + radius, 0, 0, 0 - radius, radius / 3);
            graphics.arcTo(0, 0 - radius, 0 - radius, 0, radius / 3);
            graphics.arcTo(0 - radius, 0, 0, 0 + radius, radius / 3);
            break;
        case NodeShape.Cross:
            graphics.lineStyle();
            graphics.beginFill(lineStyle.color);
            const gridSize = radius / 7 * 3;
            const smallerGridSize = gridSize * 0.5;

            graphics.moveTo(0, 0 - gridSize);
            graphics.lineTo(0 - gridSize, 0 - gridSize * 2);
            graphics.lineTo(0 - gridSize * 2, 0 - gridSize);
            graphics.lineTo(0 - gridSize, 0);
            graphics.lineTo(0 - gridSize * 2, 0 + gridSize);
            graphics.lineTo(0 - gridSize, 0 + gridSize * 2);
            graphics.lineTo(0, 0 + gridSize);
            graphics.lineTo(0 + gridSize, 0 + gridSize * 2);
            graphics.lineTo(0 + gridSize * 2, 0 + gridSize);
            graphics.lineTo(0 + gridSize, 0);
            graphics.lineTo(0 + gridSize * 2, 0 - gridSize);
            graphics.lineTo(0 + gridSize, 0 - gridSize * 2);
            graphics.lineTo(0, 0 - gridSize);
            graphics.endFill();

            graphics.moveTo(0, 0 - smallerGridSize);
            graphics.beginFill(fillColor);
            graphics.lineTo(0 - smallerGridSize, 0 - smallerGridSize * 2);
            graphics.lineTo(0 - smallerGridSize * 2, 0 - smallerGridSize);
            graphics.lineTo(0 - smallerGridSize, 0);
            graphics.lineTo(0 - smallerGridSize * 2, 0 + smallerGridSize);
            graphics.lineTo(0 - smallerGridSize, 0 + smallerGridSize * 2);
            graphics.lineTo(0, 0 + smallerGridSize);
            graphics.lineTo(0 + smallerGridSize, 0 + smallerGridSize * 2);
            graphics.lineTo(0 + smallerGridSize * 2, 0 + smallerGridSize);
            graphics.lineTo(0 + smallerGridSize, 0);
            graphics.lineTo(0 + smallerGridSize * 2, 0 - smallerGridSize);
            graphics.lineTo(0 + smallerGridSize, 0 - smallerGridSize * 2);
            graphics.lineTo(0, 0 - smallerGridSize);
            break;

        case NodeShape.Heart:
            const r = radius;
            const yOffset = radius * 0.3;
            graphics.beginFill(fillColor, alpha);
            graphics.lineStyle(lineStyle);

            graphics.moveTo(0, r * 0.6 + yOffset);
            graphics.bezierCurveTo(-r * 1.7, r * -0.25 + yOffset, -r * 0.93, -r * 1.75 + yOffset, 0, -r * 0.8 + yOffset);
            graphics.bezierCurveTo(r * 0.93, -r * 1.75 + yOffset, r * 1.7, r * -0.25 + yOffset, 0, r * 0.6 + yOffset);

            graphics.endFill();
            break;
        default:
            graphics.drawCircle(0, 0, radius);
            break;
    }
    graphics.endFill();
}