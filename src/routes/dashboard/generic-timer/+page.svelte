<!-- 
  @component A utilities page, which is meant to be a page for miscellaneous situations in committee.

  Notably, this page includes a timer and title, which can be used quite generically.
-->
<script lang="ts">
    import ToggleButton from "#lib/components/controls/ToggleButton.svelte";
    import DelFlag, { FLAGCON_SIZE_CLASSES } from "#lib/components/del-label/DelFlag.svelte";
    import Timer from "#lib/components/Timer.svelte";
    import { getClockContext } from "#lib/context/clock.svelte.ts";
    import { getSessionContext } from "#lib/context/index.svelte.js";
    import { makeEditable } from "#lib/util/attach.svelte.js";
    import { lazyslide } from "#lib/util/index.js";
    import { TimerState } from "#lib/util/timer.svelte.ts";
    import MdiFlag from "~icons/mdi/flag";
    import MdiFlagOff from "~icons/mdi/flag-off";

    const sessionData = getSessionContext();
    const { delegates } = sessionData;
    // Timer
    let timerEnabled: boolean = $state(true);
    const timer = new TimerState(getClockContext(), {
        durationSecs: () => 60,
        onRunningChange(running) {
            sessionData.updateTabTitleExtras(running, this.secsRemaining);
        },
        onTimeChange(secsRemaining) {
            sessionData.updateTabTitleExtras(this.running, secsRemaining);
        }
    });
    
    // Label
    let labelText = $state("");
    let showFlag = $state(false);

    const attrs = $derived($delegates.find(d => d.nameEquals(labelText)));
</script>

<div class="flex flex-col h-full items-stretch">
    <div class="flex flex-col grow gap-5 justify-center">
        <div class="flex flex-col items-stretch">
            {#if !(timer.running && labelText.length === 0)}
                <!-- Title, which should appear if not running or if non-empty whilst running -->
                <div class={["flex justify-center items-center", showFlag && "pb-3"]} transition:lazyslide>
                    <h2 
                        class="h2 text-center contenteditable:editable-std"
                        {@attach makeEditable({
                            when: !timer.running,
                            get value() { return labelText; },
                            set value(text) { labelText = text; },
                            allowEmpty: true
                        })}
                        placeholder="Add a title..."
                    >
                        {labelText}
                    </h2>
                    <!-- "Show flag" switch, which should appear if not running -->
                    {#if !timer.running}
                        <div
                            class="pl-3"
                            transition:lazyslide={{ axis: "x" }}
                        >
                            <ToggleButton
                                name="utils-flag-toggle"
                                label={showFlag ? "Hide Flag" : "Show Flag"}
                                bind:checked={showFlag}
                            >
                                {#snippet inactiveChild()}<MdiFlagOff />{/snippet}
                                {#snippet activeChild()}<MdiFlag />{/snippet}
                            </ToggleButton>
                        </div>
                    {/if}
                </div>
            {/if}
            <!-- Flag, which should appear if showFlag is true -->
            <!-- This setup asserts that the animation only occurs when showFlag changes or when attrs?.flagURL changes. -->
            {#key showFlag && attrs?.flagURL}
                <div transition:lazyslide>
                    {#if showFlag}
                        <div class={["mx-auto", FLAGCON_SIZE_CLASSES]}>
                            <DelFlag label={labelText} url={attrs?.flagURL} fallback="un" />
                        </div>
                    {/if}
                </div>
            {/key}
        </div>

        {#if timerEnabled}
        <div class="flex flex-col gap-5">
            <Timer
                timerState={timer}
                editable
            />
    
            <div class="flex flex-row gap-3 justify-center">
                <button class="btn preset-filled-primary-500" onclick={() => timer.toggleRunning()}>
                    {!timer.running ? 'Start' : 'Pause'}
                </button>
                <button
                    class="btn preset-filled-primary-500"
                    disabled={!timer.canReset()}
                    onclick={() => timer.reset()}
                >
                    Reset
                </button>
            </div>
        </div>
        {/if}
    </div>
</div>
