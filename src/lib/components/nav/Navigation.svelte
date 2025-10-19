<!--
  @component The navigation drawer, accessible on the left-hand side of the UI.

  This drawer allows users to visit different pages on the site.
-->
<script lang="ts">
    import { tick } from "svelte";
    import type { Action } from "svelte/action";

    import { resolve } from "$app/paths";
    import { page } from "$app/state";
    import type { RouteId } from "$app/types";

    interface Props {
        /**
         * Record of accessible links and their display name.
         */
        links: Partial<Record<RouteId, { label: string }>>;
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
    <h1 class="p-2 text-xl font-bold">Dashboard</h1>
    <ul class="flex flex-col gap-1">
        {#each Object.entries(links) as [id, { label }] (id)}
            <!-- base does not end with /, whereas id starts with / -->
            {@const href = resolve(id as RouteId)}
            {@const selected = page.url.pathname === href}
            <li class="flex">
                <a
                    class={["grow p-2 rounded", selected ? "preset-filled-primary-500" : "hover:preset-tonal"]}
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
