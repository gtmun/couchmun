<!-- 
  @component This component is the base layout for all pages on the website 
  (including /dashboard/ and /admin/).

  It simply initializes some useful stores and listeners for the page.
-->

<script lang="ts">
    import "../app.css";
    import { setContext } from "svelte";

    import { createSessionContext } from "$lib/context/index.svelte";
    import { initThemeState } from "$lib/context/theme.svelte";
    import { genStyles } from "$lib/util/chroma";

    let { children } = $props();

    createSessionContext();
    
    function keydown(e: KeyboardEvent) {
        // Allows ESC to be used to unfocus an element.
        if (e.code === "Escape") {
            (document.activeElement as HTMLElement)?.blur?.();
        }
    }

    let theme = initThemeState();
    setContext("theme", theme);
    $effect(() => {
        if ($theme.colorScheme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            if ($theme.colorScheme !== "light") $theme.colorScheme = "light";
            document.documentElement.classList.remove("dark");
        }
    });
</script>

{@render children()}

<svelte:window onkeydown={keydown} onstorage={theme.onstorage} />
<svelte:head>
    <script>
        {
            const mode = localStorage.getItem('theme.colorScheme') === "dark" ? "dark" : 'light';
            if (mode == "dark") {
                document.documentElement.classList.add("dark");
            } else if (mode == "light") {
                document.documentElement.classList.remove("dark");
            }
        }
    </script>
    <!-- HACK: Adding styles programmatically and without FOUC. -->
    {@html `<style>${genStyles($theme.primaryShade, $theme.surfaceShade)}</style>`}
</svelte:head>
