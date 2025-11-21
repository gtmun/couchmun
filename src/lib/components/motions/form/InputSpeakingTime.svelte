<script lang="ts">
    import { fade } from "svelte/transition";

    import type { InputComponentProps } from "$lib/motions/definitions";
    import { parseTime, sanitizeTime, stringifyTime } from "$lib/util/time";

    type Props = InputComponentProps<string>;
    let {
        name,
        focused = false,
        value = $bindable(),
        error,
        isExtending
    }: Props = $props();

    const speakingTimeButtons = [
        { time: 30, label: ":30" },
        { time: 45, label: ":45" },
        { time: 60, label: "1:00" },
    ];
</script>
<label class="label">
    <div class="flex justify-between">
        <span>
            Speaking Time
            {#if focused}
                <!-- Time guide -->
                <span class="text-surface-500" transition:fade={{ duration: 150 }}>
                    &middot; {sanitizeTime(value)}
                </span>
            {/if}
        </span>
        <div class="flex gap-1 items-center">
            <!-- Items are const and won't change, so key not necessary -->
            <!-- eslint-disable-next-line svelte/require-each-key -->
            {#each speakingTimeButtons as btn}
                <button
                    type="button"
                    class="btn btn-sm preset-filled tabular-nums"
                    disabled={isExtending || (typeof value !== "undefined" && parseTime(value) == btn.time)}
                    onclick={() => value = stringifyTime(btn.time)}
                    tabindex="-1"
                >
                    {btn.label}
                </button>
            {/each}
        </div>
    </div>
    <input
        {name}
        class={["input", error && "preset-input-error"]}
        placeholder="mm:ss" 
        bind:value
        onblur={() => value = sanitizeTime(value)}
        disabled={isExtending}
    >
</label>