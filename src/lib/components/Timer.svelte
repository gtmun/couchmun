<!-- 
  @component A small timer component.
  This component consists of a linear progress bar and text displaying the timer's elapsed duration.
  
  This component wraps around a `TimerState` object, displaying its information
  while also providing controls to alter its state.
-->
<script lang="ts">
    import { Progress } from "@skeletonlabs/skeleton-svelte";
    import { cubicOut } from "svelte/easing";
    import { Tween } from "svelte/motion";

    import { makeEditable } from "#lib/util/attach.svelte.js";
    import { getProgressColor } from "#lib/util/chroma.ts";
    import { a11yLabel } from "#lib/util/index.js";
    import { parseTime, stringifyTime } from "#lib/util/time.js";
    import { TimerState } from "#lib/util/timer.svelte.ts";
    import MdiPause from "~icons/mdi/pause";
    import MdiPlay from "~icons/mdi/play";

    interface Props {
        timerState: TimerState;

        // Visual properties:
        /**
         * Any height classes that should be added to the progress bar.
         */
        height?: string;

        /**
         * If enabled, this removes the duration text. 
         * By default, this is false.
         */
        hideText?: boolean;

        /**
         * If enabled, this hides the play button next to the progress bar.
         * By default, this is true.
         */
        hidePlay?: boolean;

        // Other properties:
        /**
         * If enabled, the total duration part of the text can be modified to change the duration.
         * By default, this is false.
         */
        editable?: boolean;

        /**
         * If enabled, any action to play/pause the timer is disabled.
         * This includes the play/pause button 
         * (if `hidePlay` is false) or keyboard input.
         * 
         * By default, this is false.
         */
        disablePlay?: boolean;

        /**
         * If enabled, keybinds can be used to play/pause.
         * 
         * By default, this is true.
         * If `disablePlay` is true, this prop is overrided and does nothing.
         */
        useKeyHandlers?: boolean;
    }

    let {
        timerState,
        height = "h-10",
        hideText = false,
        hidePlay = true,
        editable = false,
        disablePlay = false,
        useKeyHandlers = true,
    }: Props = $props();
    
    // Progress & display values
    const progress = Tween.of(() => timerState.progress, {
        duration: 1000,
        easing: cubicOut
    });
    
    let color = $derived(getProgressColor(progress.current));
    let barProps = $derived({
        value: Math.round(10000 * progress.current) / 100,
        height,
        meterTransition: "duration-1000 transition-colors",
        meterBg: color,
        trackBg: "preset-ui-depressed"
    });

    // Keyboard events
    function keydown(e: KeyboardEvent) {
        if (disablePlay) return;
        if (!useKeyHandlers) return;
        if (e.target !== document.body) return;

        if (!e.repeat) {
            if (e.code === "Enter") timerState.toggleRunning();
            if (e.code === "Space") timerState.running = true;
        }
    }
    function keyup(e: KeyboardEvent) {
        if (disablePlay) return;
        if (!useKeyHandlers) return;
        if (e.target !== document.body) return;

        if (e.code === "Space") timerState.running = false;
    }

    function setDuration(text?: string) {
        let dur = text ? parseTime(text) : undefined;
        if (typeof dur !== "undefined") {
            timerState.reset(dur);
        }
    }
</script>

<div class="flex flex-col gap-3">
    <h2 
        class={["h2", "text-center", "tabular-nums", hideText && "hidden"]}
        role="timer"
    >
        {stringifyTime(timerState.secsRemaining)}/<span
            class="contenteditable:editable-std"
            {@attach makeEditable({
                when: editable && !timerState.running,
                get value() { return stringifyTime(timerState.durationSecs) },
                set value(time) { setDuration(time) }
            })}
            role="none"
        >
            {stringifyTime(timerState.durationSecs)}
        </span>
    </h2>
    <div class="grid grid-cols-[1fr_auto] gap-1 items-center">
        <!-- The progress bar -->
        <Progress value={barProps.value}>
            <Progress.Track class={[barProps.trackBg, barProps.height]}>
                <Progress.Range class={[barProps.meterBg, barProps.meterTransition]} />
            </Progress.Track>
        </Progress>
        <!-- A start/pause button -->
        {#if !hidePlay}
            <button 
                class="btn-icon btn-icon-xl preset-filled-primary-500" 
                onclick={() => timerState.toggleRunning()}
                disabled={disablePlay || timerState.isElapsed()}
                {...a11yLabel(timerState.running ? "Pause Timer" : "Start Timer")}
            >
                {#if timerState.running}
                    <MdiPause />
                {:else}
                    <MdiPlay />
                {/if}
            </button>
        {/if}
    </div>
</div>

<svelte:window onkeydown={keydown} onkeyup={keyup} />
