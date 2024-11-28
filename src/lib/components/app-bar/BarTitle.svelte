<script lang="ts">
    interface Props {
        title: string;
    }

    let { title = $bindable() }: Props = $props();
    let heading: HTMLHeadingElement | undefined = $state();

    function updateTitle() {
        // When unfocused, update title
        if (heading) {
            heading.textContent = title = heading.textContent?.trim() || title;
        }
    }
    function keyDown(k: KeyboardEvent) {
        // If Enter is pressed, unfocus the title
        if (k.code === "Enter") {
            k.preventDefault();
            heading?.blur();
        }
    }
</script>

<h2 
    class="h2 text-center break-all border-b-4 border-transparent hover:border-surface-500 focus:border-surface-500 transition rounded" 
    contenteditable 
    onfocusout={updateTitle} 
    onkeydown={keyDown} 
    bind:this={heading}
>
    {title}
</h2>