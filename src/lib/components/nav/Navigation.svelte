<script lang="ts">
    import { base } from "$app/paths";
    import { page } from "$app/stores";

    export let links: Record<string, { label: string }>;
    export let close: () => void;
</script>

<h3 class="h3 p-4">Dashboard</h3>
<hr />
<!-- Nav links -->
<nav class="list-nav p-2">
    <ul>
        {#each Object.entries(links) as [id, { label }], i}
            <!-- base does not end with /, whereas id starts with / -->
            {@const href = `${base}${id}`}
            {@const selected = $page.url.pathname === href}
            <li>
                <a 
                    on:click={close} 
                    {href} 
                    class:variant-soft-primary={selected}
                    data-focusindex={1 - +selected}
                    tabindex={i + 1}
                >
                    {label}
                </a>
            </li>
        {/each}
    </ul>
</nav>
