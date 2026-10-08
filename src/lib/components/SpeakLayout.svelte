<!-- 
  @component Layout typically used for pages consisting of a timer and a speakers list.
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    import MdiChevronDown from "~icons/mdi/chevron-down";

    interface Props {
        main?: Snippet<[]>,
        side?: Snippet<[]>
    }

    let { main, side }: Props = $props();
</script>

<div class="flex flex-col lg:flex-row h-full gap-8 items-stretch @container">
    <!--
        Under mobile, the timer encompasses the whole page 
        and the speakers list can be accessed by scrolling down.

        Under desktop, both are on the same screen,
        with the left side being the timer and the right side being the speakers list.
    -->
    <!-- Left/Top -->
    <div class="flex flex-col grow shrink-0 basis-full lg:shrink lg:basis-auto">
        {#if side}
            <div class="flex justify-center h-6 lg:hidden">
                <!-- Placeholder which matches size of chevron-down -->
            </div>
        {/if}
        {@render main?.()}
        {#if side}
            <!-- Mobile chevron -->
            <div class="flex justify-center lg:hidden">
                <MdiChevronDown />
            </div>
        {/if}
    </div>
    <!-- Right/Bottom -->
    <div class="flex flex-col lg:basis-[30cqw] xl:basis-[20cqw] lg:shrink-0 gap-4">
        {@render side?.()}
    </div>
</div>
