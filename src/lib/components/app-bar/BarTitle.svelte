<script lang="ts">
    export let title: string;
    let heading: HTMLHeadingElement;

    function updateTitle() {
        // When unfocused, update title
        heading.textContent = title = heading.textContent?.trim() || title;
    }
    function keyDown(k: KeyboardEvent) {
        // If Enter is pressed, unfocus the title
        if (k.code === "Enter") {
            k.preventDefault();
            heading.blur();
        }
    }
</script>

<h2 
    class="h2 text-center break-all" 
    contenteditable 
    on:focusout={updateTitle} 
    on:keydown={keyDown} 
    bind:this={heading}
>
    {title}
</h2>