<script lang="ts">
    import "$lib/panel/public";
    import Timer from "$lib/Timer.svelte";
    import { persisted } from "svelte-persisted-store";

    let timer: Timer;
    let start: () => void;
    let storage = persisted("value", 0);
    let dataStorage = persisted("data", {
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


<div class="flex flex-col gap-5">
    <h1 class="h1">Welcome to SvelteKit</h1>
    <div>
        <h2 class="h2">Admin panel demo</h2>
        <p>Visit <a class="anchor" href="/admin" target="_blank">/admin</a> to open admin panel</p>
    </div>
    <div>
        <h2 class="h2">Timer demo</h2>
        
        <button class="btn btn-sm variant-filled-primary" on:click={timer.start}>Start</button>
        <button class="btn btn-sm variant-filled-primary" on:click={timer.pause}>Pause</button>
        <button class="btn btn-sm variant-filled-primary" on:click={timer.reset}>Reset</button>
        <Timer duration={10} bind:this={timer} bind:start />
    </div>
    <div>
        <h2 class="h2">Persistent Storage demo</h2>
        
        <button class="btn btn-sm variant-filled-primary" on:click={() => $storage++}>increment value</button>
        <button class="btn btn-sm variant-filled-primary" on:click={() => (storage.reset(), updater ^= 1)}>delete key</button>
        <div>value: {$storage}</div>
        
        <br>

        <button class="btn btn-sm variant-filled-primary" on:click={() => $dataStorage.first++}>increment value 1</button>
        <button class="btn btn-sm variant-filled-primary" on:click={() => $dataStorage.second++}>increment value 2</button>
        <button class="btn btn-sm variant-filled-primary" on:click={() => (dataStorage.reset(), updater ^= 1)}>delete all keys</button>
        <div>value: {$dataStorage.first}</div>
        <div>value: {$dataStorage.second}</div>

        <div>
            localStorage contents: <code>{localStorageStr}</code>
        </div>
    </div>
</div>