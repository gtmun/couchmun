<script lang="ts">
    import type { InputComponentProps } from "$lib/motions/definitions";

    interface Props extends InputComponentProps<string> {
        label?: string
    }
    let {
        name,
        error,
        value = $bindable(),
        label = "Topic",
        isExtending
    }: Props = $props();
</script>

<label class="label">
    <span>{label}</span>
    <input 
        {name}
        class={["input", error && "preset-input-error"]}
        bind:value
        disabled={isExtending}
    >
</label>