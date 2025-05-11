<!-- 
  @component Bar stats, consisting of 3 bubbles and the 3 attendance numbers.
-->

<script lang="ts">
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
            var(--color-primary-800) 0deg 180deg,
            var(--color-primary-500) 180deg 360deg
        );
    }
    .conic-tth {
        background: conic-gradient(
            var(--color-secondary-800) 0deg 120deg,
            var(--color-secondary-500) 120deg 360deg
        );
    }
    .conic-full {
        background-color: var(--color-tertiary-500);
    }
</style>
<div class="flex flex-row gap-3 justify-center">
    <div class="flex flex-row gap-1 items-center" aria-label="Majority ({maj})" title="Majority ({maj})">
        <div class="size-6 rounded-full conic-half"></div>
        {maj}
    </div>
    <div class="flex flex-row gap-1 items-center" aria-label="Supermajority ({supermaj})" title="Supermajority ({supermaj})">
        <div class="size-6 rounded-full conic-tth"></div>
        {supermaj}
    </div>
    <div class="flex flex-row gap-1 items-center" aria-label="Total ({total})" title="Total ({total})">
        <div class="size-6 rounded-full conic-full"></div>
        {total}
    </div>
</div>