<script lang="ts">
    import "../app.css";
    import type { Settings } from "$lib/dashboard/types";
    import delegates from '$lib/delegate_presets/un_delegates.json';
    import { computePosition, autoUpdate, offset, shift, flip, arrow, size } from '@floating-ui/dom';
    import { initializeStores, Modal, storePopup } from "@skeletonlabs/skeleton";
    import { setContext } from "svelte";
    import { writable } from "svelte/store";
    import { DEFAULT_SORT_PRIORITY } from "$lib/dashboard/points-motions/definitions";

    initializeStores();
    storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow, size });

    setContext<Settings>("settings", {
        delegateAttributes: writable(structuredClone(delegates)),
        sortOrder: writable(structuredClone(DEFAULT_SORT_PRIORITY)),
        delegatesEnabled: writable(Object.fromEntries(
            Object.keys(delegates).map(k => [k, true])
        ))
    });
</script>

<slot></slot>

<Modal />