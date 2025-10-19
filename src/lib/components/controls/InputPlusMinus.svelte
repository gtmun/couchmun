<script lang="ts">
    import MdiPlus from "~icons/mdi/plus";
    import MdiMinus from "~icons/mdi/minus";

    interface Props {
        name: string,
        value: number,
        ariaLabelName?: string,
        [inputProp: string]: any
    }
    let { name, ariaLabelName = undefined, value = $bindable(), ...rest }: Props = $props();
</script>
<div class="flex gap-1 items-center">
    <input {name} type="number" class="input" bind:value {...rest}>
    <button
        type="button"
        class="btn-icon preset-filled"
        aria-label="Increment {ariaLabelName}"
        title="Increment {ariaLabelName}"
        onclick={() => value = (value ?? 0) - 1}
    >
        <MdiMinus />
    </button>
    <button
        type="button"
        class="btn-icon preset-filled"
        aria-label="Decrement {ariaLabelName}"
        title="Decrement {ariaLabelName}"
        onclick={() => value = (value ?? 0) + 1}
    >
        <MdiPlus />
    </button>
</div>