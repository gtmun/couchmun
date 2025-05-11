<!--
  @component The navigation drawer, accessible on the left-hand side of the UI.

  This drawer allows users to visit different pages on the site.
-->
<script lang="ts">
    import { base } from "$app/paths";
    import { page } from "$app/state";

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
</script>

<h3 class="h3 p-4">Dashboard</h3>
<hr />
<!-- Nav links -->
<nav class="list-nav p-2">
    <ul>
        {#each Object.entries(links) as [id, { label }], i}
            <!-- base does not end with /, whereas id starts with / -->
            {@const href = `${base}${id}`}
            {@const selected = page.url.pathname === href}
            <li>
                <a 
                    onclick={close} 
                    {href} 
                    class:preset-tonal-primary={selected}
                    data-focusindex={1 - +selected}
                    tabindex={i + 1}
                >
                    {label}
                </a>
            </li>
        {/each}
    </ul>
</nav>
