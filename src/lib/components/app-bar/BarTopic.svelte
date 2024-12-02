<script lang="ts">
    interface Props {
        topic: string,
    }

    let { topic = $bindable() }: Props = $props();
    let heading: HTMLHeadingElement | undefined = $state();

    function updateTopic() {
        // When unfocused, update topic
        if (heading) {
            heading.textContent = topic = heading.textContent?.trim() || topic;
        }
    }
    function keyDown(k: KeyboardEvent) {
        // If Enter is pressed, unfocus the topic
        if (k.code === "Enter") {
            k.preventDefault();
            heading?.blur();
        }
    }
</script>

<div>
    <h2
        class="h2 italic self-center -mb-1 break-all border-b-4 border-transparent hover:border-surface-500 focus:border-surface-500 transition rounded" 
        contenteditable 
        onfocusout={updateTopic} 
        onkeydown={keyDown} 
        bind:this={heading}
    >
    {topic}
    </h2>
</div>