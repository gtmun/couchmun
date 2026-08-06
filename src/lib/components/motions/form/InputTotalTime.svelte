<script lang="ts">
    import InputTime from "./InputTime.svelte";

    import type { InputComponentProps } from "$lib/motions/definitions";
    import { a11yLabel, hasKey, lazyslide } from "$lib/util";
    import { stringifyTime } from "$lib/util/time";
    import MdiFractionOneHalf from "~icons/mdi/fraction-one-half";

    type Props = InputComponentProps<string>;
    let {
        value = $bindable(),
        isExtending,
        motion,
        ...rest
    }: Props = $props();


    /**
     * Sets total time input to half of the previous motion.
     */
    function extendByHalf() {
        if (motion && hasKey(motion, "totalTime")) {
            value = stringifyTime(motion.totalTime / 2);
        }
    }
</script>

<InputTime bind:value {isExtending} {motion} {...rest} label="Total Time">
    {#snippet sideButtons(o)}
        {#if isExtending}
            <button
                type="button"
                class="btn btn-sm preset-filled"
                disabled={!!o.value}
                onclick={() => {
                    extendByHalf();
                    o.focus();
                }}
                {...a11yLabel("Set Time to Half")}
                transition:lazyslide
            >
                <MdiFractionOneHalf />
            </button>
        {/if}
    {/snippet}
</InputTime>