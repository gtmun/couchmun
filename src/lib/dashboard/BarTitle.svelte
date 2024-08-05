<script lang="ts">
    export let title: string;
    let heading: HTMLHeadingElement;

    function updateTitle() {
        // When unfocused, update title
        title = heading.textContent ?? "";
    }
    function keyDown(k: KeyboardEvent) {
        // If Enter is pressed, unfocus the title
        if (k.code === "Enter") {
            heading.blur();
        }
    }
</script>

<h2 class="h2" contenteditable on:focusout={updateTitle} on:keydown={keyDown} bind:this={heading}>{title}</h2>