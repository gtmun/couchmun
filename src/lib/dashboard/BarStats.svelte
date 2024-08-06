<script lang="ts">
    import { ConicGradient, type ConicStop } from '@skeletonlabs/skeleton';

    export let total: number;
    export let majOverride: number | undefined = undefined;
    export let supermajOverride: number | undefined = undefined;

    $: maj = majOverride ?? Math.ceil(total / 2);
    $: supermaj = supermajOverride ?? Math.ceil(total * 2 / 3);

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
    <div class="flex flex-row gap-1 align-center">
        <ConicGradient width="w-6" height="h-6" stops={majConic} />
        {maj}
    </div>
    <div class="flex flex-row gap-1 align-center">
        <ConicGradient width="w-6" height="h-6" stops={supermajConic} />
        {supermaj}
    </div>
    <div class="flex flex-row gap-1 align-center">
        <ConicGradient width="w-6" height="h-6" stops={totalConic} />
        {total}
    </div>
</div>