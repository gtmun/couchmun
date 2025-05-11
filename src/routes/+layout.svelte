<!-- 
  @component This component is the base layout for all pages on the website 
  (including /dashboard/ and /admin/).

  It simply initializes some useful stores and listeners for the page.
-->

<script lang="ts">
    import "../app.css";
    import { computePosition, autoUpdate, offset, shift, flip, arrow, size } from '@floating-ui/dom';
    import { createSessionContext } from "$lib/context/index.svelte";

    let { children } = $props();

    initializeStores();
    storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow, size });

    createSessionContext();
    
    function keydown(e: KeyboardEvent) {
        // Allows ESC to be used to unfocus an element.
        if (e.code === "Escape") {
            (document.activeElement as HTMLElement)?.blur?.();
        }
    }
</script>

<Modal />

{@render children()}

<svelte:window onkeydown={keydown} />
<div class="hidden">
    <!-- Force these styling classes to always exist -->
    <!-- see IconLabel.svelte -->
    <div class="sm:hidden md:hidden lg:hidden xl:hidden 2xl:hidden"></div>
    <div class="sm:block md:block lg:block xl:block 2xl:block"></div>
</div>