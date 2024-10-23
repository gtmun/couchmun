<script lang="ts">
    import { getModalStore } from "@skeletonlabs/skeleton";
    import { type Snippet } from "svelte";

    interface Props {
        title: string;
        children: Snippet<[{
            submit: typeof submit,
            close: typeof close
        }]>;
    }

    let { title, children }: Props = $props();

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
    {@render children({ submit, close })}
</div>