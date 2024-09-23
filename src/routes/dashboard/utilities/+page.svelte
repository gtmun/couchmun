<script lang="ts">
    import DelAutocomplete from "$lib/components/del-input/DelAutocomplete.svelte";
    import DelLabel from "$lib/components/DelLabel.svelte";
    import LabeledSlideToggle from "$lib/components/LabeledSlideToggle.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { getSessionDataContext } from "$lib/stores/session";
    import { parseTime } from "$lib/util/time";

    import type { Readable } from "svelte/store";
    import Icon from "@iconify/svelte";
    import { popup, type PopupSettings } from "@skeletonlabs/skeleton";

    const { settings: { delegateAttributes }, presentDelegates } = getSessionDataContext();

    // Timer
    let timerEnabled: boolean = true;
    let durInput: string;
    
    let duration: number = 60;
    let running: boolean = false;
    let reset: () => void;
    let canReset: Readable<boolean>;
    
    // Label
    let labelType: "delegate" | "title" | "none" = "title";
    let labelText: string = "";

    function getKey(label: string) {
        return Object.keys($delegateAttributes).find(k => $delegateAttributes[k].name === label) ?? label;
    }
    // Configuration
    const CONFIGURE_MODAL_SETTINGS: PopupSettings = {
        event: "click",
        target: "configure",
        closeQuery: ''
    }
    function setDuration() {
        let secs = parseTime(durInput);
        if (typeof secs !== "undefined") {
            duration = secs;
            reset();
        }
    }
</script>

<div class="flex flex-col h-full items-stretch">
    <button
        class="btn-icon variant-filled-surface self-end"
        use:popup={CONFIGURE_MODAL_SETTINGS}
        aria-label="Configure Utilities"
        title="Configure Utilities"
    >
        <Icon icon="mdi:wrench" width="24" height="24" />
    </button>
    <div class="flex flex-col flex-grow gap-5 justify-center">
        {#if labelType === "delegate"}
            <DelLabel speaker={getKey(labelText)} />
        {:else if labelType === "title"}
            <h2 class="h2 text-center">{labelText}</h2>
        {/if}

    
        {#if timerEnabled}
            <Timer
                name="total"
                bind:duration
                bind:running
                bind:canReset
                bind:reset
                editable
            />
    
            <div class="flex flex-row gap-3 justify-center">
                <button class="btn variant-filled-primary" on:click={() => running = !running}>
                    {!running ? 'Start' : 'Pause'}
                </button>
                <button class="btn variant-filled-primary" disabled={!$canReset} on:click={reset}>Reset</button>
            </div>
        {/if}
    </div>
</div>

<div data-popup="configure">
    <div class="card p-4">
        <div class="flex flex-col gap-4 overflow-hidden">
            <!-- Timer config -->
             <LabeledSlideToggle name="enable-timer" bind:checked={timerEnabled}>
                <span><strong>Timer</strong></span>
             </LabeledSlideToggle>
            {#if timerEnabled}
                <div class="flex flex-row gap-5">
                    <form class="contents" on:submit|preventDefault={setDuration}>
                        <label class="flex flex-grow items-center justify-between gap-3">
                            <span>Time</span>
                            <input class="input" bind:value={durInput} on:input={setDuration} placeholder="mm:ss" />
                        </label>
                    </form>
                </div>
            {/if}
            <hr />
            <!-- Label config -->
            <form class="contents">
                <label class="flex flex-grow items-center justify-between gap-3">
                    <span><strong>Label</strong></span>
                    <select class="select" bind:value={labelType}>
                        <option value="delegate" label="Delegate" />
                        <option value="title" label="Title" />
                        <option value="none" label="None" />
                    </select>
                </label>
                {#if labelType !== "none"}
                    <label class="flex flex-grow items-center justify-between gap-3">
                        <span>Text</span>
                        <input class="input" bind:value={labelText} />
                    </label>
                    {#if labelType === "delegate"}
                        <div class="card bg-surface-200-700-token">
                            <DelAutocomplete
                                bind:input={labelText}
                                delegates={$delegateAttributes}
                                presentDelegates={$presentDelegates}
                                maxHeight="max-h-36"
                                on:selection={e => labelText = e.detail.label}
                            />
                        </div>
                    {/if}
                {/if}
            </form>
        </div>
    </div>
</div>