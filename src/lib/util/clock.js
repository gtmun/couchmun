/**
 * @param {number} ts 
 */
function loop(ts) {
    postMessage({ kind: "startTick", ts });
    postMessage({ kind: "endTick" });
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);