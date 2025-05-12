<!--
  @component The navigation drawer, accessible on the left-hand side of the UI.

  This drawer allows users to visit different pages on the site.
-->
<script lang="ts">
    import { base } from "$app/paths";
    import { page } from "$app/state";
    import { tick } from "svelte";
    import type { Action } from "svelte/action";

    interface Props {
        /**
         * Record of accessible links and their display name.
         */
        links: Record<string, { label: string }>;
        /**
         * A method callback that "closes" the drawer that 
         * this navigation resides under.
         */
        close: () => void;
    }
    let { links, close }: Props = $props();

    const focusIfSelected = ((e: HTMLElement, selected: boolean) => {
        if (selected) tick().then(() => e.focus());
    }) satisfies Action<HTMLElement, boolean>;
</script>

<!-- Nav links -->
<nav>
    <h3 class="text-xl font-bold">Dashboard</h3>
    <ul class="flex flex-col gap-1">
        {#each Object.entries(links) as [id, { label }]}
            <!-- base does not end with /, whereas id starts with / -->
            {@const href = `${base}${id}`}
            {@const selected = page.url.pathname === href}
            <li class="flex">
                <a
                    class="grow p-2 rounded {selected ? 'preset-filled-primary-500' : 'hover:preset-tonal'}"
                    onclick={close} 
                    {href}
                    tabindex="0"
                    use:focusIfSelected={selected}
                >
                    {label}
                </a>
            </li>
        {/each}
    </ul>
</nav>
