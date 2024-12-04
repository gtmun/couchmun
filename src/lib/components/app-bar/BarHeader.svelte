<script lang="ts">
    interface Props {
        title: string,
        size?: "sm" | "md" | "lg",
        styles?: string,
        editable?: boolean
    }

    let { title = $bindable(), size = "md", styles = "", editable = true }: Props = $props();
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


<h1 
    class="{styles} text-center break-all rounded {editable ? "border-b-4 border-transparent hover:border-surface-500 focus:border-surface-500 transition-[border-color,font-size]" : ""}"
    class:h1={size == "lg"}
    class:h2={size == "md"}
    class:h3={size == "sm"}
    contenteditable={editable}
    onfocusout={updateTitle}
    onkeydown={keyDown}
    bind:this={heading}
>
    {title}
</h1>