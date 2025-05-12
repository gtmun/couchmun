<!-- 
  @component A utilities page, which is meant to be a page for miscellaneous situations in committee.

  Notably, this page includes a timer and title, which can be used quite generically.
-->
<script lang="ts">
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import LabeledSwitch from "$lib/components/LabeledSwitch.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { lazyslide } from "$lib/util";
    import { parseTime } from "$lib/util/time";
    import MdiWrench from "~icons/mdi/wrench";
    import { Popover } from "@skeletonlabs/skeleton-svelte";
    import { POPUP_CARD_CLASSES } from "$lib/util/popup";
    import DelCombobox from "$lib/components/DelCombobox.svelte";

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
    let configurePopupOpen = $state(false);
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
    <Popover
        open={configurePopupOpen}
        onOpenChange={e => configurePopupOpen = e.open}
        positioning={{ placement: 'bottom' }}
        triggerBase="preset-filled-surface-500"
        triggerClasses="btn-icon self-end"
        triggerAriaLabel="Configure Utilities"
        contentBase={POPUP_CARD_CLASSES}
        arrow
    >
        {#snippet trigger()}
            <MdiWrench />
        {/snippet}
        {#snippet content()}
            <div class="flex flex-col gap-4 overflow-hidden">
                <!-- Timer config -->
                    <LabeledSwitch name="enable-timer" bind:checked={timerEnabled}>
                    <span><strong>Timer</strong></span>
                    </LabeledSwitch>
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
                            {#if labelType === "delegate"}
                                <DelCombobox bind:input={labelText} delegates={Object.values($delegates)} />
                            {:else}
                                <input class="input" bind:value={labelText} />
                            {/if}
                        </label>
                    {/if}
                </form>
            </div>
        {/snippet}
    </Popover>
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
