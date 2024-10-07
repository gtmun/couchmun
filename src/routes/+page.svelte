<script lang="ts">
    import { base } from "$app/paths";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import Icon from "@iconify/svelte";
</script>

<MetaTags
    title="CouchMUN"
    description="A tool to help Model United Nations committees keep time, oversee debate, and manage delegates."
/>

<div class="flex flex-col justify-center h-screen gap-3">
    <h1 class="h1 text-center">CouchMUN</h1>

    <!-- Entry buttons -->
    <div class="flex justify-center gap-3">
        <a class="btn variant-filled-primary" href="{base}/dashboard">
            Open Dashboard
        </a>
        <a 
            class="btn-icon variant-filled-primary" 
            href="{base}/admin/settings"
            aria-label="Settings"
            title="Settings"
        >
            <Icon icon="mdi:gear" width="24" height="24" />
        </a>
    </div>
</div>