const channel = new BroadcastChannel("mun-control");

console.log("admin login");

export function sendMessage() {
    channel.postMessage("hello!");
}