<!--
  @component Modal card for editing (or creating) a delegate.

  This modal consists of a simple form to specify the delegate's attributes.
-->
<script lang="ts">
    import UniModalContent, { type ExitState } from "./UniModalContent.svelte";

    import type { DelegateAttrs } from "$lib/types";
    import { a11yLabel } from "$lib/util";
    import { proxify } from "$lib/util/sv.svelte";
    import MdiDelete from "~icons/mdi/delete";
    import MdiPlus from "~icons/mdi/plus";

    type SubmitData = { attrs: DelegateAttrs };
    interface Props {
        /**
         * Original properties of the delegate.
         */
        attrs: DelegateAttrs,

        /**
         * Callers to pass to content.
         */
        exitState: ExitState<SubmitData>,
    }

    let { 
        attrs,
        exitState
    }: Props = $props();

    let newAttrs = $derived(proxify(attrs));

    function submitValue(e: SubmitEvent, submit: (t: SubmitData) => void) {
        e.preventDefault();

        let attrs = $state.snapshot(newAttrs);
        attrs.aliases = attrs.aliases
            .map(s => s.trim())
            .filter(s => s);
        submit({ attrs });
    }
</script>

<UniModalContent title="Editing {newAttrs.name}" {exitState}>
    {#snippet main({ submit, close })}
        <form class="flex flex-col gap-3" onsubmit={(e) => submitValue(e, submit)}>
            <label>
                <span>Name</span>
                <input class="input" bind:value={newAttrs.name} required placeholder="Modelunia">
            </label>
            <div>
                <span>Aliases (optional)</span>
                <div class="flex flex-col items-center justify-center gap-2 p-2 border border-surface-200-800 rounded max-h-120 overflow-auto">
                    <div class={["grid grid-cols-[1fr_auto] gap-1 w-full", newAttrs.aliases.length == 0 && "hidden"]}>
                        <!-- eslint-disable-next-line svelte/require-each-key -->
                        {#each newAttrs.aliases as _, i}
                            <input class="input" bind:value={newAttrs.aliases[i]}>
                            <button
                                class="btn-icon-std preset-filled-error-500"
                                onclick={() => newAttrs.aliases.splice(i, 1)}
                                type="button"
                                {...a11yLabel("Delete Alias")}
                            >
                                <MdiDelete />
                            </button>
                        {/each}
                    </div>
                    <button
                        class="btn btn-sm preset-filled-primary-500 w-1/3"
                        onclick={() => newAttrs.aliases.push("")}
                        type="button"
                    >
                        <MdiPlus />
                        Add Alias
                    </button>
                </div>
            </div>
            <label>
                <span>Flag URL (optional)</span>
                <input class="input" bind:value={newAttrs.flagURL} placeholder="https://example.com/flag.svg">
            </label>
            <div class="flex justify-end gap-3">
                <button class="btn preset-filled-error-500" type="button" onclick={close}>Cancel</button>
                <button class="btn preset-filled-primary-500" type="submit">Submit</button>
            </div>
        </form>
    {/snippet}
</UniModalContent>