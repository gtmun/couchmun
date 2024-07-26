<script lang="ts">
    import "$lib/panel/public";
    import Timer from "$lib/panel/Timer.svelte";

    let timer: Timer;
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="/admin" target="_blank">/admin</a> to open admin panel</p>
<button on:click={timer.start}>Start</button>
<button on:click={timer.pause}>Pause</button>
<button on:click={timer.reset}>Reset</button>
<Timer duration={10} bind:this={timer} />