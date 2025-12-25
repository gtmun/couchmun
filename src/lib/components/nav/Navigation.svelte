<!--
  @component The navigation drawer, accessible on the left-hand side of the UI.

  This drawer allows users to visit different pages on the site.
-->
<script lang="ts">
    import { resolve } from "$app/paths";
    import { page } from "$app/state";
    import type { RouteId } from "$app/types";

    interface MenuHeader {
        type: "header",
        label: string
    }
    interface MenuLink {
        type: "link",
        href: RouteId,
        label?: string
    }
    type MenuItem = MenuHeader | MenuLink;
    interface Props {
        /**
         * Record of accessible links and their display name.
         */
        menu: readonly MenuItem[];
        /**
         * A method callback that "closes" the drawer that 
         * this navigation resides under.
         */
        close: () => void;
    }
    let { menu, close }: Props = $props();
</script>

<!-- Nav links -->
<nav>
    <ul class="flex flex-col">
        <!-- eslint-disable-next-line svelte/require-each-key -->
        {#each menu as item}
            {#if item.type === "header"}
                <hr class="hr my-2" />
                <h2 class="nav-header p-2">
                    {item.label}
                </h2>
            {:else if item.type === "link"}
                {@const href = resolve(item.href as RouteId)}
                {@const selected = page.url.pathname === href}
                <li class="flex">
                    <a
                        class={["grow p-2 rounded", selected ? "preset-filled-primary-500" : "hover:preset-tonal"]}
                        onclick={close} 
                        {href}
                        tabindex="0"
                    >
                        {item.label}
                    </a>
                </li>
            {/if}
        {/each}
    </ul>
</nav>
