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
    const { stats } = createStatsContext();
    
    function keydown(e: KeyboardEvent) {
        // Allows ESC to be used to unfocus an element.
        if (e.code === "Escape") {
            (document.activeElement as HTMLElement)?.blur?.();
        }
    }

    function storage(e: StorageEvent) {
        // HACK: Synchronize stats across different screens
        if (e.storageArea === localStorage && e.key === "statistics.stats") {
            if (e.newValue != null && e.oldValue !== e.newValue) {
                let json = undefined;
                try {
                    json = JSON.parse(e.newValue);
                } catch (e) {

                }
                
                if (json) stats.set(json);
            }
        }
    }
</script>

<Modal />

<slot></slot>

<svelte:window on:keydown={keydown} on:storage={storage} />