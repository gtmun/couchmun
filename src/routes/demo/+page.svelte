<script lang="ts">
    import "$lib/panel/public";
    import { persistentStorage } from "$lib/storage";
    import Timer from "$lib/Timer.svelte";

    let timer: Timer;
    let start: () => void;
    let storage = persistentStorage("value", 0);
    let dataStorage = persistentStorage("data", {
        first: 0,
        second: 0
    });
    let updater = 0;

    let localStorageStr: string = "";
    $: {
        // if either update,
        $storage,
        $dataStorage,
        updater,
        // then
        localStorageStr = JSON.stringify(globalThis.localStorage, undefined, 2);
    }
</script>

<h1>Welcome to SvelteKit</h1>

<hr>

<h2>Admin panel demo</h2>

<p>Visit <a href="/admin" target="_blank">/admin</a> to open admin panel</p>

<hr>

<h2>Timer demo</h2>

<button on:click={timer.start}>Start</button>
<button on:click={timer.pause}>Pause</button>
<button on:click={timer.reset}>Reset</button>
<Timer duration={10} bind:this={timer} bind:start />

<hr>

<h2>Persistent Storage demo</h2>

<button on:click={() => $storage++}>increment value</button>
<button on:click={() => (storage.delete(), updater ^= 1)}>delete key</button>
<div>value: {$storage}</div>

<br>

<button on:click={() => $dataStorage.first++}>increment value 1</button>
<button on:click={() => $dataStorage.second++}>increment value 2</button>
<button on:click={() => (dataStorage.delete(), updater ^= 1)}>delete all keys</button>
<div>value: {$dataStorage.first}</div>
<div>value: {$dataStorage.second}</div>

<div>
    localStorage contents: <code>{localStorageStr}</code>
</div>