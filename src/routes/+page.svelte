<script lang="ts">
    import { base } from "$app/paths";
    import Icon from "@iconify/svelte";
</script>

<div class="flex flex-col justify-center h-screen gap-3">
    <h1 class="h1 text-center">CouchMUN</h1>

    <!-- Entry buttons -->
    <div class="flex justify-center gap-3">
        <a class="btn variant-filled-primary" href="{base}/dashboard">Open Dashboard</a>
        <a class="btn-icon variant-filled-primary" href="{base}/settings">
            <Icon icon="mdi:gear" width="24" height="24" />
        </a>
    </div>
</div>