<script lang="ts">
    import { ConicGradient, type ConicStop } from '@skeletonlabs/skeleton';

    export let total: number;
    export let majOverride: number | undefined = undefined;
    export let supermajOverride: number | undefined = undefined;

    // given n,
    // maj is smallest integer > n/2
    // supermaj is smallest integer > 2n/3
    // TODO: make this cleaner
    $: maj = majOverride ?? Math.min(Math.ceil(total / 2 + 0.01), total);
    $: supermaj = supermajOverride ?? Math.min(Math.ceil(total * 2 / 3 + 0.01), total);

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
</script>

<div class="flex flex-row gap-5 justify-center">
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