<script lang="ts">
    import DelAutocomplete from "$lib/components/del-input/DelAutocomplete.svelte";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import LabeledSlideToggle from "$lib/components/LabeledSlideToggle.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { db } from "$lib/db";
    import { enabledDelegatesStore } from "$lib/db/del";
    import { nameEq } from "$lib/util";
    import { parseTime } from "$lib/util/time";

    import Icon from "@iconify/svelte";
    import { popup, type PopupSettings } from "@skeletonlabs/skeleton";

    const delegates = enabledDelegatesStore(db.delegates);

    // Timer
    let timerEnabled: boolean = $state(true);
    let durInput: string = $state("");
    
    let duration: number = $state(60);
    let running: boolean = $state(false);
    let timer: Timer | undefined = $state();
    
    // Label
    let labelType: "delegate" | "title" | "none" = $state("title");
    let labelText: string = $state("");

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
            timer?.reset();
        }
    }
    function submitDuration(e: SubmitEvent) {
        e.preventDefault();
        setDuration();
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
            <DelLabel attrs={$delegates.find(d => nameEq(labelText, d))} fallbackName={labelText} />
        {:else if labelType === "title"}
            <h2 class="h2 text-center">{labelText}</h2>
        {/if}

    
        {#if timerEnabled}
            <Timer
                name="total"
                bind:duration
                bind:running
                bind:this={timer}
                editable
            />
    
            <div class="flex flex-row gap-3 justify-center">
                <button class="btn variant-filled-primary" onclick={() => running = !running}>
                    {!running ? 'Start' : 'Pause'}
                </button>
                <button class="btn variant-filled-primary" disabled={!timer?.canReset()} onclick={timer?.reset}>Reset</button>
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
                    <form class="contents" onsubmit={submitDuration}>
                        <label class="flex flex-grow items-center justify-between gap-3">
                            <span>Time</span>
                            <input class="input" bind:value={durInput} oninput={setDuration} placeholder="mm:ss" />
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
                        <option value="delegate" label="Delegate"></option>
                        <option value="title" label="Title"></option>
                        <option value="none" label="None"></option>
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
                                delegates={$delegates}
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