<script lang="ts">
    import { SlideToggle } from "@skeletonlabs/skeleton";

    export let name: string;
    export let checked: boolean | undefined = undefined;
    export let disabled: boolean | undefined = undefined;
    export let labelClass: string = "flex items-center justify-between gap-3";
</script>

<!-- svelte-ignore a11y-label-has-associated-control : SlideToggle is a control -->
<label class={labelClass}>
    <slot />
    <SlideToggle 
        bind:name
        bind:checked
        bind:disabled
        active="bg-primary-500"
        {$$props}
    />
</label>