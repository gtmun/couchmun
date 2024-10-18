import type { ClockMessage } from "$lib/types";

function loop(ts: number) {
    postMessage({ kind: "startTick", ts } satisfies ClockMessage);
    postMessage({ kind: "endTick" } satisfies ClockMessage);
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);