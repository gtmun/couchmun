<script lang="ts">
    import type { Snippet } from "svelte";

    import type { InputComponentProps } from "$lib/motions/definitions";
    import { sanitizeTime } from "$lib/util/time";

    interface Props extends InputComponentProps<string> {
        label?: string,
        sideButtons?: Snippet<[{ value?: string, focus: () => void }]>,
        inputDisabled?: boolean
    };
    let {
        name,
        value = $bindable(),
        error,
        // Time input specific fields:
        label = "Time",
        sideButtons = undefined,
        inputDisabled = false,
    }: Props = $props();

    const inpId = $props.id();
    let inputEl = $state<HTMLInputElement>();
</script>
<label class="label group" for="input-time-{inpId}">
    <div class="flex justify-between">
        <span>
            {label}
            <!-- Time guide -->
            <span class="text-surface-500 not-group-has-focus-within:opacity-0 transition-opacity duration-150 tabular-nums">
                &middot; {sanitizeTime(value)}
            </span>
        </span>
        <div>
            {@render sideButtons?.({
                get value() { return value; },
                set value(s) { value = s; },
                focus: () => inputEl?.focus(),
            })}
        </div>
    </div>
    <input
        {name}
        id="input-time-{inpId}"
        class={["input", error && "preset-input-error"]}
        placeholder="mm:ss" 
        bind:value
        bind:this={inputEl}
        onchange={() => value = sanitizeTime(value)}
        disabled={inputDisabled}
    >
</label>