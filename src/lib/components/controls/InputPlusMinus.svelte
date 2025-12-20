<!-- 
  @component An input with decrement/input buttons.
  
  This replaces a standard `<input type="number">`.
-->


<script lang="ts">
    import MdiMinus from "~icons/mdi/minus";
    import MdiPlus from "~icons/mdi/plus";

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
        aria-label="Decrement {ariaLabelName}"
        title="Decrement {ariaLabelName}"
        onclick={() => {
            if (typeof rest.min !== "number" || value > rest.min) {
                value = (value ?? 0) - 1;
            }
        }}
    >
        <MdiMinus />
    </button>
    <button
        type="button"
        class="btn-icon preset-filled"
        aria-label="Increment {ariaLabelName}"
        title="Increment {ariaLabelName}"
        onclick={() => {
            if (typeof rest.max !== "number" || value < rest.max) {
                value = (value ?? 0) + 1;
            }
        }}
    >
        <MdiPlus />
    </button>
</div>