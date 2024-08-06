<script lang="ts">
    import { page } from "$app/stores";

    export let close: () => void;

    const links = [
        { label: "Roll Call", href: "/dashboard/roll-call" },
        { label: "Current Motion", href: "/dashboard/motion" },
        { label: "Speakers List", href: "/dashboard/speaker-list" },
        { label: "Points and Motions", href: "/dashboard/points-motions" },
    ]
</script>

<h3 class="h3 p-4">Dashboard</h3>
<hr />
<!-- Nav links -->
<nav class="list-nav p-2">
    <ul data-focusindex=0>
        {#each links as link}
            <li>
                <a 
                    on:click={close} 
                    href={link.href} 
                    class:!variant-soft-primary={$page.url.pathname === link.href}
                >
                    {link.label}
                </a>
            </li>
        {/each}
    </ul>
</nav>
