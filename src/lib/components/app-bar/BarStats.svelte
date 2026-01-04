<!-- 
  @component Bar stats, consisting of 3 bubbles and the 3 attendance numbers.
-->

<script lang="ts">
    import { a11yLabel } from "$lib/util";

    interface Props {
        /**
         * Total attendance.
         */
        total: number;
        /**
         * An override for the majority value
         * (if the default calculation is not sufficient).
         */
        majOverride?: number | undefined;
        /**
         * An override for the supermajority value
         * (if the default calculation is not sufficient).
         */
        supermajOverride?: number | undefined;
    }
    let {
        total,
        majOverride = undefined,
        supermajOverride = undefined
    }: Props = $props();

    // Given the total attendance (n),
    // the majority is the smallest integer > n/2
    // the supermajority is the smallest integer >= 2/3 n
    let maj: number = $derived(majOverride ?? smallestIntGt(total / 2));
    let supermaj: number = $derived(supermajOverride ?? smallestIntGe(total * 2 / 3));

    /**
     * Smallest integer greater than `n`, capped to at least 0.
     * @param n total
     */
    function smallestIntGt(n: number) {
        return n > 0 ? Math.ceil(n + 0.01) : 0;
    }
    /**
     * Smallest integer greater than or equal to `n`, capped to at least 0.
     * @param n total
     */
    function smallestIntGe(n: number) {
        return n > 0 ? Math.ceil(n) : 0;
    }
</script>

<style>
    .conic-half {
        background: conic-gradient(
            var(--color-primary-900) 0deg 180deg,
            var(--color-primary-500) 180deg 360deg
        );
        filter: hue-rotate(-45deg);
    }
    .conic-tth {
        background: conic-gradient(
            var(--color-primary-900) 0deg 120deg,
            var(--color-primary-500) 120deg 360deg
        );
    }
    .conic-full {
        background-color: var(--color-primary-500);
        filter: hue-rotate(45deg);
    }
</style>
<div class="flex flex-row gap-3 justify-center tabular-nums">
    <div class="flex flex-row gap-1 items-center" {...a11yLabel(`Majority (${maj})`)}>
        <div class="size-6 rounded-full conic-half"></div>
        {maj}
    </div>
    <div class="flex flex-row gap-1 items-center" {...a11yLabel(`Supermajority (${supermaj})`)}>
        <div class="size-6 rounded-full conic-tth"></div>
        {supermaj}
    </div>
    <div class="flex flex-row gap-1 items-center" {...a11yLabel(`Total (${total})`)}>
        <div class="size-6 rounded-full conic-full"></div>
        {total}
    </div>
</div>