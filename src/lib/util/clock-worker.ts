/**
 * A clock source.
 * 
 * This can be deployed in a Web Worker to create a synchronized clock independent of the UI.
 * This is used in `#lib/context/clock`.
 */

function loop() {
    postMessage(Date.now());
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
