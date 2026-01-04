<!--
  @component This component is the base layout for the admin pages on the site.
  
  This basically initializes the admin app bar (the yellow bar on the top).
-->
<script lang="ts">
    import { AppBar } from '@skeletonlabs/skeleton-svelte';

    import { resolve } from "$app/paths";
    import BarHeader from '$lib/components/app-bar/BarHeader.svelte';
    import { db } from '$lib/db/index.svelte';
    import { a11yLabel } from '$lib/util';
    import MdiChevronLeft from "~icons/mdi/chevron-left";

    let { children } = $props();
    const title = db.settingStore("title", "");
</script>

<div class="grid h-screen grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header>
        <AppBar class="preset-ui-admin-header">   
            <AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
                <AppBar.Lead>
                    <a
                        href="{resolve("/dashboard")}"
                        class="btn-icon-std"
                        {...a11yLabel("Return to Dashboard")}
                        tabindex={0}
                    >
                        <MdiChevronLeft />
                    </a>
                </AppBar.Lead>
                <AppBar.Headline>
                    <div class="flex flex-col gap-1">
                        <BarHeader bind:title={$title} />
                    </div>
                </AppBar.Headline>
                <AppBar.Trail>
                    <!-- Alignment spacing -->
                    <div class="btn-icon-std"></div>
                </AppBar.Trail>
            </AppBar.Toolbar>
        </AppBar>
    </header>
    <!-- Main -->
    <main class="space-y-4 p-4 overflow-auto">
        {@render children()}
    </main>
</div>