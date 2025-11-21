<script lang="ts">
    import MdiPencil from "~icons/mdi/pencil";

    interface Props {
        colors: { id: string, label: string, displayShade: string }[],
        selectedColor?: string,
        withCustom?: boolean
    }
    let { colors, selectedColor = $bindable(), withCustom = false }: Props = $props();

    let usingCustom = $derived(selectedColor?.startsWith("#") ?? false);
</script>

<div class="flex flex-wrap gap-2">
    {#each colors as color (color.id)}
        <button 
            class={[
                "selector-btn rounded-full size-6 p-4",
                selectedColor === color.id && ["outline-1 outline-offset-1"]
            ]}
            style:--selector-hue={color.displayShade}
            onclick={() => selectedColor = color.id}
            title={color.label}
            aria-label={color.label}
            role="radio"
            aria-checked={selectedColor === color.id}
            ></button>
    {/each}
    {#if withCustom}
        <div class="relative">
            <input
                class={["input rounded-full!", usingCustom ? "outline-1! outline-offset-1!" : "opacity-0"]}
                type="color"
                bind:value={
                    () => selectedColor?.startsWith('#') ? selectedColor : "#000000",
                    color => selectedColor = color
                }
            >
            <div class={[
                "absolute top-0 left-0 m-auto w-full h-full",
                "flex items-center justify-center pointer-events-none",
                "rounded-full bg-rainbow",
                usingCustom && "opacity-0"
            ]}>
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

    .bg-rainbow {
        background: conic-gradient(in oklch,
            var(--color-red-500),
            var(--color-yellow-500),
            var(--color-green-500),
            var(--color-cyan-500), 
            var(--color-blue-500),
            var(--color-fuchsia-500),
            var(--color-red-500)
        );
    }
</style>