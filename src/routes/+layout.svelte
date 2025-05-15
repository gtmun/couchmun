<!-- 
  @component This component is the base layout for all pages on the website 
  (including /dashboard/ and /admin/).

  It simply initializes some useful stores and listeners for the page.
-->

<script lang="ts">
    import "../app.css";
    import { createSessionContext } from "$lib/context/index.svelte";
    import { genStyles } from "$lib/util/chroma";

    let { children } = $props();

    createSessionContext();
    
    function keydown(e: KeyboardEvent) {
        // Allows ESC to be used to unfocus an element.
        if (e.code === "Escape") {
            (document.activeElement as HTMLElement)?.blur?.();
        }
    }
    function onstorage(e: StorageEvent) {
        if (e.key === "color-scheme") {
            let mode = e.newValue === "dark" ? "dark" : 'light';
            if (mode === "dark") {
                document.documentElement.classList.add("dark");
            } else if (mode === "light") {
                document.documentElement.classList.remove("dark");
            }
        }
    }
</script>

{@render children()}

<svelte:window onkeydown={keydown} onstorage={onstorage} />
<svelte:head>
    <script>
        {
            const mode = localStorage.getItem('color-scheme') === "dark" ? "dark" : 'light';
            if (mode == "dark") {
                document.documentElement.classList.add("dark");
            } else if (mode == "light") {
                document.documentElement.classList.remove("dark");
            }
        }
    </script>
    <!-- HACK: Adding styles programmatically and without FOUC -->
    {@html `<style>${genStyles()}</style>`}
</svelte:head>
