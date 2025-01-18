/**
 * A clock source.
 * 
 * This can be deployed in a Web Worker to create a synchronized clock independent of the UI.
 * See `Timer`'s module script for an example.
 */

import type { ClockMessage } from "$lib/types";

function loop(ts: number) {
    postMessage({ kind: "startTick", ts } satisfies ClockMessage);
    postMessage({ kind: "endTick" } satisfies ClockMessage);
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);