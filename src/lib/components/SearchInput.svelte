<!-- An input with a search icon next to it. That's it. -->
<script lang="ts">
    import { a11yLabel } from "$lib/util";
    import MdiSearch from "~icons/mdi/search";

    let { value = $bindable() } = $props();
    const id = $props.id();
</script>

<div class="field-group grid-cols-[auto_1fr]">
    <label class="label label-text preset-tonal" for="search-{id}" {...a11yLabel("Search")}>
        <MdiSearch />
    </label>
    <input class="input" id="search-{id}" bind:value placeholder="Search...">
</div>
