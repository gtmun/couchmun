<!-- 
  @component Bar stats, consisting of 3 bubbles and the 3 attendance numbers.
-->

<script lang="ts">
    import { ConicGradient, type ConicStop } from '@skeletonlabs/skeleton';

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
    // the supermajority is the smallest integer > 2/3 n
    let maj: number = $derived(majOverride ?? smallestIntegerGt(total / 2));
    let supermaj: number = $derived(supermajOverride ?? smallestIntegerGt(total * 2 / 3));

    const majConic: ConicStop[] = [
        { color: 'rgb(var(--color-primary-800))', start: 0, end: 50 },
        { color: 'rgb(var(--color-primary-500))', start: 50, end: 100 },
    ];
    const supermajConic: ConicStop[] = [
        { color: 'rgb(var(--color-secondary-800))', start: 0, end: 33 },
        { color: 'rgb(var(--color-secondary-500))', start: 33, end: 100 },
    ];
    const totalConic: ConicStop[] = [
        { color: 'rgb(var(--color-tertiary-500))', start: 0, end: 100 },
    ];
    /**
     * Smallest integer greater than `n`, capped to at least 0.
     * @param n total
     */
    function smallestIntegerGt(n: number) {
        return n > 0 ? Math.ceil(n + 0.01) : 0;
    }
</script>

<div class="flex flex-row gap-3 justify-center">
    <div class="flex flex-row gap-1 align-center" aria-label="Majority ({maj})" title="Majority ({maj})">
        <ConicGradient width="w-6" height="h-6" stops={majConic} />
        {maj}
    </div>
    <div class="flex flex-row gap-1 align-center" aria-label="Supermajority ({supermaj})" title="Supermajority ({supermaj})">
        <ConicGradient width="w-6" height="h-6" stops={supermajConic} />
        {supermaj}
    </div>
    <div class="flex flex-row gap-1 align-center" aria-label="Total ({total})" title="Total ({total})">
        <ConicGradient width="w-6" height="h-6" stops={totalConic} />
        {total}
    </div>
</div>