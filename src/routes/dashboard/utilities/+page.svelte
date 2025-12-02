<!-- 
  @component A utilities page, which is meant to be a page for miscellaneous situations in committee.

  Notably, this page includes a timer and title, which can be used quite generically.
-->
<script lang="ts">
    import ToggleButton from "$lib/components/controls/ToggleButton.svelte";
    import DelFlag from "$lib/components/del-label/DelFlag.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { lazyslide } from "$lib/util";
    import { makeEditable } from "$lib/util/attach.svelte";
    import MdiFlag from "~icons/mdi/flag";
    import MdiFlagOff from "~icons/mdi/flag-off";

    const sessionData = getSessionContext();
    const { delegates } = sessionData;

    // Timer
    let timerEnabled: boolean = $state(true);
    
    let duration = $state<number>(60);
    let running = $state<boolean>(false);
    let timer = $state<Timer>();
    
    // Label
    let labelText = $state<string>("");
    let showFlag = $state<boolean>(false);

    const attrs = $derived($delegates.find(d => d.nameEquals(labelText)));
</script>

<div class="flex flex-col h-full items-stretch">
    <div class="flex flex-col grow gap-5 justify-center">
        <div class="flex flex-col items-center">
            {#if !(running && labelText.length === 0)}
                <!-- Title, which should appear if not running or if non-empty whilst running -->
                <div class={["flex justify-center items-center", showFlag && "pb-3"]} transition:lazyslide>
                    <h2 
                        class="h2 text-center contenteditable:editable-std"
                        {@attach makeEditable({
                            when: !running,
                            get value() { return labelText; },
                            set value(text) { labelText = text; },
                            allowEmpty: true
                        })}
                        placeholder="Add a title..."
                    >
                        {labelText}
                    </h2>
                    <!-- "Show flag" switch, which should appear if not running -->
                    {#if !running}
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
                        <DelFlag label={labelText} url={attrs?.flagURL} height="h-[25dvh]" fallback="un" />
                    {/if}
                </div>
            {/key}
        </div>

        {#if timerEnabled}
        <div class="flex flex-col gap-5">
            <Timer
                bind:duration
                {running}
                bind:this={timer}
                onRunningChange={r => {
                    running = r;
                    sessionData.updateTabTitleExtras(r, timer?.secsRemaining());
                }}
                onTimeChange={msElapsed => sessionData.updateTabTitleExtras(running, msElapsed / 1000)}
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
