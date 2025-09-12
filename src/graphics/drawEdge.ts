import tinycolor from "tinycolor2";
import { GraphStoresContainer } from "../state/storesContainer";
import { RenderedEdge } from "../core/renderedEdge";
import { EdgeType } from "../api/dataTypes";

const UNSCALED_EDGE_LENGTH = 1000; //todo: this is needed elsewhere, so move it into new file parameters or similar
const ARROWHEAD_LENGTH = UNSCALED_EDGE_LENGTH / 2;
const ARROWHEAD_THICKNESS = 100;

export const drawEdge = (edge: RenderedEdge, $states: GraphStoresContainer) => {
    if (edge.type === EdgeType.None) return;
    edge.graphics.clear();
    // edge.graphics.beginFill(tinycolor().lighten(5).toString(), thoughtFillStyle.alpha);
    edge.graphics.lineStyle({ width: 30, color: edge.color, alpha: 0.2 });

    switch (edge.type) {
        case EdgeType.Line:
            edge.graphics.moveTo(0, 0);
            edge.graphics.lineTo(UNSCALED_EDGE_LENGTH, 0);
            break;
        case EdgeType.Arrow:

            edge.graphics.moveTo(0, 0);
            edge.graphics.lineTo(UNSCALED_EDGE_LENGTH - ARROWHEAD_LENGTH, 0);

            edge.graphics.beginFill(edge.color, 0.2);
            edge.graphics.lineStyle();
            edge.graphics.lineTo(UNSCALED_EDGE_LENGTH - ARROWHEAD_LENGTH, -ARROWHEAD_THICKNESS);
            edge.graphics.lineTo(UNSCALED_EDGE_LENGTH, 0);
            edge.graphics.lineTo(UNSCALED_EDGE_LENGTH - ARROWHEAD_LENGTH, ARROWHEAD_THICKNESS);
            edge.graphics.lineTo(UNSCALED_EDGE_LENGTH - ARROWHEAD_LENGTH, 0);
            edge.graphics.endFill();
            break;
        case EdgeType.Tapered:
            const segments = 100;
            const thickness = 100;

            edge.graphics.lineStyle(0); // no outline

            const len = UNSCALED_EDGE_LENGTH;
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

                const w0 = (1 - t0) * thickness;
                const w1 = (1 - t1) * thickness;

                const quad = [
                    startX + px * w0 / 2, startY + py * w0 / 2,
                    startX - px * w0 / 2, startY - py * w0 / 2,
                    endX - px * w1 / 2, endY - py * w1 / 2,
                    endX + px * w1 / 2, endY + py * w1 / 2,
                ];

                const segmentAlpha = 0.5 * t0;

                edge.graphics.beginFill(edge.color, segmentAlpha);
                edge.graphics.drawPolygon(quad);
                edge.graphics.endFill();
            }
            break;
        case EdgeType.CurvedLine:
            edge.graphics.moveTo(0, 0);
            edge.graphics.quadraticCurveTo(
                UNSCALED_EDGE_LENGTH / 2,
                -UNSCALED_EDGE_LENGTH / 2,
                UNSCALED_EDGE_LENGTH,
                0
            );
            break;
    }
}