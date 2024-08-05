<script>
    import "../app.css";
    import { computePosition, autoUpdate, offset, shift, flip, arrow, size } from '@floating-ui/dom';
    import { initializeStores, storePopup } from "@skeletonlabs/skeleton";

    initializeStores();
    storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow, size });
</script>

<slot></slot>
