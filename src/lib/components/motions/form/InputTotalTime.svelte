<script lang="ts">
    import { fade } from "svelte/transition";

    import type { InputComponentProps } from "$lib/motions/definitions";
    import { a11yLabel, hasKey, lazyslide } from "$lib/util";
    import { sanitizeTime, stringifyTime } from "$lib/util/time";
    import MdiFractionOneHalf from "~icons/mdi/fraction-one-half";

    type Props = InputComponentProps<string>;
    let {
        name,
        error,
        focused = false,
        value = $bindable(),
        isExtending,
        motion
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
<label class="label">
    <div class="flex justify-between">
        <span>
            Total Time
            {#if focused}
                <!-- Time guide -->
                <span class="text-surface-500" transition:fade={{ duration: 150 }}>
                    &middot; {sanitizeTime(value)}
                </span>
            {/if}
        </span>
        {#if isExtending}
            <button
                type="button"
                class="btn btn-sm preset-filled"
                disabled={!!value}
                onclick={extendByHalf}
                {...a11yLabel("Set Time to Half")}
                transition:lazyslide
            >
                <MdiFractionOneHalf />
            </button>
        {/if}
    </div>
    <input 
        {name}
        class={["input", error && "preset-input-error"]}
        placeholder="mm:ss" 
        bind:value
        onchange={() => value = sanitizeTime(value)}
    >
</label>