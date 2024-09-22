<script lang="ts">
    import { getModalStore } from "@skeletonlabs/skeleton";

    export let title: string;

    const modalStore = getModalStore();

    function submit(value: any) {
        $modalStore[0].response?.(value);
        close();
    }
    function close() {
        modalStore.close();
    }
</script>

<div class="card p-4 w-1/2">
    <h2 class="h2 p-4">{title}</h2>
    <slot {submit} {close} />
</div>