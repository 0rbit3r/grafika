import tinycolor from "tinycolor2";
import { GraphStoresContainer } from "../state/storesContainer";
import { RenderedEdge } from "../core/renderedEdge";
import { EdgeType } from "../api/dataTypes";

export const drawEdge = (edge: RenderedEdge, $states: GraphStoresContainer) => {
    if (edge.type === EdgeType.None) return;
    edge.graphics.clear();
    // edge.graphics.beginFill(tinycolor().lighten(5).toString(), thoughtFillStyle.alpha);
    edge.graphics.lineStyle({ width: 30, color: edge.color, alpha: 0.2 });

    switch (edge.type){
        case EdgeType.Arrow:
            // scaling arrows might look janky - it might make sence to divide the arrow into the line and the arrow head?
            // for now, let's just make it a line...
            edge.graphics.moveTo(0, 0);
            edge.graphics.lineTo(1000, 0);
            break;
        case EdgeType.Line:
        case EdgeType.Tapered:
            const segments = 20;
            const thickness = 200;

            edge.graphics.lineStyle(0); // no outline

            const len = 1000;
            const ux = 1;  // unit vector along x-axis
            const uy = 0;
            const px = 0;  // perpendicular vector
            const py = 1;

            for (let i = 0; i < segments; i++) {
                const t0 = i / segments;
                const t1 = (i + 1) / segments;

                const startX = ux * len * t0;
                const startY = uy * len * t0;
                const endX = ux * len * t1;
                const endY = uy * len * t1;

                const w0 = thickness - (1 - t0) * thickness;
                const w1 = thickness - (1 - t1) * thickness;

                const quad = [
                    startX + px * w0 / 2, startY + py * w0 / 2,
                    startX - px * w0 / 2, startY - py * w0 / 2,
                    endX - px * w1 / 2, endY - py * w1 / 2,
                    endX + px * w1 / 2, endY + py * w1 / 2,
                ];

                const segmentAlpha = 0.5 * (1 - t0);

                edge.graphics.beginFill(edge.color, segmentAlpha);
                edge.graphics.drawPolygon(quad);
                edge.graphics.endFill();
            }
            break;
    }
}