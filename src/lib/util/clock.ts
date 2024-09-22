export type ClockMessage = 
    | { kind: "startTick", ts: number } 
    | { kind: "endTick"}

function loop(ts: number) {
    postMessage({ kind: "startTick", ts } satisfies ClockMessage);
    postMessage({ kind: "endTick" } satisfies ClockMessage);
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);