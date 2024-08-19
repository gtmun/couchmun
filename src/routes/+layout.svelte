<script lang="ts">
    import "../app.css";
    import { computePosition, autoUpdate, offset, shift, flip, arrow, size } from '@floating-ui/dom';
    import { initializeStores, Modal, storePopup } from "@skeletonlabs/skeleton";
    import { createSettingsContext } from "$lib/settings/stores";

    initializeStores();
    storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow, size });

    createSettingsContext();
</script>

<slot></slot>

<Modal />