const channel = new BroadcastChannel("mun-control");

console.log("client login");
channel.addEventListener("message", e => {
    document.write(e.data);
})