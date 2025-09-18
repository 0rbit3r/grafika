// simulation container
export const SIM_WIDTH = 30000;
export const SIM_HEIGHT = 30000;

// Frames are reset every use interaction

// How many frames to allow the nodes to overlap
export const FRAMES_WITH_OVERLAP = 0;

// size and positions of nodes
export const DEFAULT_RADIUS = 60;

// Radius of the initial positions circle
export const INITIAL_POSITIONS_RADIUS = 9000;

// forces simulation
export const DEFAULT_EDGE_LENGTH = 350;
// N > 1 make the connected nodes' push force weaker than the pull force and vice versa
export const EDGE_COMPRESSIBILITY_FACTOR = 1;

export const MAX_PULL_FORCE = 50;

// can only increase the thought (ie. first few sizes will default to 1 if set under 1)
export const IDEAL_DIST_SIZE_MULTIPLIER = 0.1;//0.01;

export const PUSH_THRESH = 5000;
export const MAX_PUSH_FORCE = 50;

export const GRAVITY_FREE_RADIUS = 40000;

// When thoughts "appear" on screen they should not immediatelly start influencing other thoughts.
// This parameter is the length of the "ease-in" period for influencing other thoughts
export const INFLUENCE_FADE_IN = 250;
export const FRAMES_WITH_NO_INFLUENCE = 20;

// Slows the simulation but makes it more stable
export const MAX_MOMENTUM_DAMPENING = 1.55; //1.55

// These parameters are the ease-in starting value for the momentum dampening rate
export const MOMENTUM_DAMPENING_START_AT = 1.5;
export const MOMENTUM_DAMPENING_EASE_IN_FRAMES = 10;

// A movement cap of nodes to prevent them from moving too fast
export const MAX_MOVEMENT_SPEED = 200;

// Mass allows asymmetric forces based on radius
export const NODE_MASS_ON = false;
export const MAX_MASS_DIFFERENCE_PULL_FORCE_MULTIPLIER = 2;
export const MIN_MASS_DIFFERENCE_PULL_FORCE_MULTIPLIER = 0.5;
export const MAX_MASS_DIFFERENCE_PUSH_FORCE_MULTIPLIER = 2;
export const MIN_MASS_DIFFERENCE_PUSH_FORCE_MULTIPLIER = 0.5;

export const BASE_EDGE_WIDTH = 9;
export const BASE_EDGE_ALPHA = 0.8;

export const HIGHLIGHTED_EDGE_WIDTH = 14;
export const HIGHLIGHTED_EDGE_ALPHA = 1;

export const UNHIGHLIGHTED_EDGE_WIDTH = 8;
export const UNHIGHLIGHTED_EDGE_ALPHA = 0.7;

// nodes appearing appearance
export const NEW_NODE_INVISIBLE_FOR = 0;
export const NEW_NODE_FADE_IN_FRAMES = 0;
// Backdrop
export const BACKDROP_ZOOM_THRESHOLD_FULLY_VISIBLE = 0.05;
export const BACKDROP_ZOOM_THRESHOLD_HIDDEN = 0.1;


// zoom
export const MAX_ZOOM = 5;
export const MIN_ZOOM = 0.004;
export const INITIAL_ZOOM = 0.025;
// Titles are visible when the zoom is bigger than this value
export const ZOOM_TEXT_VISIBLE_THRESHOLD = 0.2;
export const ZOOM_TEXT_INVISIBLE_THRESHOLD = 0.1;
// Constants for controlling the zoop step on mouse wheel
export const ZOOM_STEP_MULTIPLICATOR_WHEEL = 1.04;
export const ZOOM_STEP_MULTIPLICATOR_BUTTONS = 1.02;

export const TEXT_WORD_WRAP = 160;

// Graph exploration - BFS depth
export const NEIGHBORHOOD_DEPTH = 2;

// FDL force functions
export const pushForce = (borderDist: number) => {

    // if (borderDist === 0) {
    //     return -borderDist;
    // }
    // if (borderDist < 0) {
    //     return -borderDist;
    // }

    const computed = 30 / Math.sqrt(borderDist <= 0 ? 0.0001 : borderDist);
    return Math.min(MAX_PUSH_FORCE, computed);
};

export const pullForce = (borderDist: number, idealDistance: number) => {

    // if (borderDist < 0) {
    //     // console.log('negative borderDist ', borderDist);
    //     return borderDist / 2;
    // }

    const computed = 0.01 * (borderDist - idealDistance);
    const limited = computed > MAX_PULL_FORCE
        ? MAX_PULL_FORCE
        : computed < -MAX_PULL_FORCE
            ? -MAX_PULL_FORCE
            : computed;

    const final = Math.sign(limited) === -1
        ? limited / EDGE_COMPRESSIBILITY_FACTOR
        : limited;

    return final;
};


export const gravityForce = (centerDistance: number) => {
    const GRAVITY_FORCE = 0.15;

    if (centerDistance > GRAVITY_FREE_RADIUS) {
        return GRAVITY_FORCE * Math.log(centerDistance - GRAVITY_FREE_RADIUS + 1);
    }
    else {
        return 0;
    }
}

// Makes bigger (ie. more referenced) thoughts less active and thus reduces jitter after loading them
export const inEdgesLengthForceDivisor = (bl: number) => {
    if (bl < 3) {
        return 1;
    }
    return 1 + bl / 5;
}

// export const linksNumberForceDivisor = (source: RenderedThought, target: RenderedThought) => {
//     const maxReferences = Math.max(source.links.length, target.links.length);
//     const maxBacklinks = Math.max(source.backlinks.length, target.backlinks.length);

//     return maxBacklinks / 3 + Math.pow(maxReferences, 1.1);
// }



// MORE SET IN STONE OBSCURE PARAMETERS

export const NODE_BORDER_THICKNESS = 0.1;

// Rendered edge is rendered with this length and then scaled and rotated appropriately
export const RENDERED_EDGE_DEFAULT_LENGTH = 100;