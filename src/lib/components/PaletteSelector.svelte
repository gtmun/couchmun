<script lang="ts">
    import MdiPencil from "~icons/mdi/pencil";

    interface Props {
        colors: { id: string, label: string, displayShade: string }[],
        selectedColor?: string,
        withCustom?: boolean
    }
    let { colors, selectedColor = $bindable(), withCustom = false }: Props = $props();

    let usingCustom = $state(false);
</script>

<div class="flex flex-wrap gap-2">
    {#each colors as color}
        <button 
            class={[
                "selector-btn rounded-full size-6 p-4",
                selectedColor === color.id && ["outline-1 outline-offset-1"]
            ]}
            style:--selector-hue={color.displayShade}
            onclick={() => {
                selectedColor = color.id;
                usingCustom = false;
            }}
            title={color.label}
            aria-label={color.label}
            role="radio"
            aria-checked={selectedColor === color.id}
            ></button>
    {/each}
    {#if withCustom}
        <div class="relative">
            <input
                class={["input rounded-full!", usingCustom && "outline-1! outline-offset-1!"]}
                type="color"
                oninput={() => {usingCustom = true;}}
                bind:value={selectedColor}
            >
            <div class="absolute top-0 left-0 m-auto w-full h-full flex items-center justify-center pointer-events-none">
                <MdiPencil class="text-white" />
            </div>
        </div>
    {/if}
</div>

<style>
    .selector-btn {
        background-color: var(--selector-hue);
        outline-color: var(--selector-hue);
    }
</style>