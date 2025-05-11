<!-- 
  @component A utilities page, which is meant to be a page for miscellaneous situations in committee.

  Notably, this page includes a timer and title, which can be used quite generically.
-->
<script lang="ts">
    import DelAutocomplete from "$lib/components/DelAutocomplete.svelte";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import LabeledSlideToggle from "$lib/components/LabeledSlideToggle.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { lazyslide } from "$lib/util";
    import { interactivePopup, POPUP_CARD_CLASSES } from "$lib/util/popup";
    import { parseTime } from "$lib/util/time";
    import MdiWrench from "~icons/mdi/wrench";

    const { delegates } = getSessionContext();

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
    const POPUP_TARGET = "configure-popup";
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
        class="btn-icon preset-filled-surface-500 self-end"
        use:popup={interactivePopup(POPUP_TARGET)}
        aria-label="Configure Utilities"
        title="Configure Utilities"
    >
        <MdiWrench />
    </button>
    <div class="flex flex-col grow gap-5 justify-center">
        <div class="pb-5">
            {#if labelType === "delegate"}
                <div transition:lazyslide>
                    <DelLabel attrs={$delegates.find(d => d.nameEquals(labelText))} fallbackName={labelText} />
                </div>
            {:else if labelType === "title"}
                <h2 class="h2 text-center">{labelText}</h2>
            {/if}
        </div>

        {#if timerEnabled}
        <div class="flex flex-col gap-5">
            <Timer
                bind:duration
                bind:running
                bind:this={timer}
                editable
            />
    
            <div class="flex flex-row gap-3 justify-center">
                <button class="btn preset-filled-primary-500" onclick={() => running = !running}>
                    {!running ? 'Start' : 'Pause'}
                </button>
                <button class="btn preset-filled-primary-500" disabled={!timer?.canReset()} onclick={timer?.reset}>Reset</button>
            </div>
        </div>
        {/if}
    </div>
</div>

<div class="{POPUP_CARD_CLASSES}" data-popup={POPUP_TARGET}>
    <div class="flex flex-col gap-4 overflow-hidden">
        <!-- Timer config -->
            <LabeledSlideToggle name="enable-timer" bind:checked={timerEnabled}>
            <span><strong>Timer</strong></span>
            </LabeledSlideToggle>
        {#if timerEnabled}
            <div class="flex flex-row gap-5">
                <form class="contents" onsubmit={submitDuration}>
                    <label class="flex grow items-center justify-between gap-3">
                        <span>Time</span>
                        <input class="input" bind:value={durInput} oninput={setDuration} placeholder="mm:ss" />
                    </label>
                </form>
            </div>
        {/if}
        <hr />
        <!-- Label config -->
        <form class="contents">
            <label class="flex grow items-center justify-between gap-3">
                <span><strong>Label</strong></span>
                <select class="select" bind:value={labelType}>
                    <option value="delegate" label="Delegate"></option>
                    <option value="title" label="Title"></option>
                    <option value="none" label="None"></option>
                </select>
            </label>
            {#if labelType !== "none"}
                <label class="flex grow items-center justify-between gap-3">
                    <span>Text</span>
                    <input class="input" bind:value={labelText} />
                </label>
                {#if labelType === "delegate"}
                    <div class="card bg-surface-200-800">
                        <DelAutocomplete
                            bind:input={labelText}
                            delegates={Object.values($delegates)}
                            maxHeight="max-h-36"
                            on:selection={e => labelText = e.detail.label}
                        />
                    </div>
                {/if}
            {/if}
        </form>
    </div>
</div>