<!-- An input with a search icon next to it. That's it. -->
<script lang="ts">
    import { a11yLabel } from "$lib/util";
    import MdiSearch from "~icons/mdi/search";

    let { value = $bindable() } = $props();
</script>

<label class="flex gap-2 items-center">
    <div {...a11yLabel("Search")}>
        <MdiSearch />
    </div>
    <input class="input" bind:value placeholder="Search...">
</label>
