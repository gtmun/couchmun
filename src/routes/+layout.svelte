<script lang="ts">
    import "../app.css";
    import { computePosition, autoUpdate, offset, shift, flip, arrow, size } from '@floating-ui/dom';
    import { initializeStores, Modal, storePopup } from "@skeletonlabs/skeleton";
    import { createSettingsContext } from "$lib/stores/settings";
    import { createSessionDataContext } from "$lib/stores/session";
    import { createStatsContext } from "$lib/stores/stats";

    initializeStores();
    storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow, size });

    createSettingsContext();
    createSessionDataContext();
    createStatsContext();
    
    function keydown(e: KeyboardEvent) {
        // Allows ESC to be used to unfocus an element.
        if (e.code === "Escape") {
            (document.activeElement as HTMLElement)?.blur?.();
        }
    }
</script>

<Modal />

<slot></slot>

<svelte:window on:keydown={keydown} />