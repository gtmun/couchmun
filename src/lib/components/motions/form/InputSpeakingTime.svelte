<script lang="ts">
    import InputTime from "./InputTime.svelte";

    import type { InputComponentProps } from "$lib/motions/definitions";
    import { parseTime, stringifyTime } from "$lib/util/time";

    type Props = InputComponentProps<string>;
    let {
        value = $bindable(),
        isExtending,
        ...rest
    }: Props = $props();

    const speakingTimeButtons = [
        { time: 30, label: ":30" },
        { time: 45, label: ":45" },
        { time: 60, label: "1:00" },
    ];
</script>

<InputTime
    bind:value
    {isExtending}
    {...rest}
    label="Speaking Time"
    inputDisabled={isExtending}
>
    {#snippet sideButtons(o)}
        <div class="flex gap-1 items-center">
            <!-- Items are const and won't change, so key not necessary -->
            <!-- eslint-disable-next-line svelte/require-each-key -->
            {#each speakingTimeButtons as btn}
                <button
                    type="button"
                    class="btn btn-sm preset-filled tabular-nums"
                    disabled={isExtending || (typeof o.value !== "undefined" && parseTime(o.value) == btn.time)}
                    onclick={() => {
                        o.value = stringifyTime(btn.time);
                        o.focus();
                    }}
                    tabindex="-1"
                >
                    {btn.label}
                </button>
            {/each}
        </div>
    {/snippet}
</InputTime>
