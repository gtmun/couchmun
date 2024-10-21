<script lang="ts">
    import { base } from "$app/paths";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import Icon from "@iconify/svelte";
</script>

<MetaTags
    title="CouchMUN"
    description="A tool to support chairs of Model UN committees in keeping time, overseeing debate, and managing delegates."
/>

<div class="flex flex-col justify-between h-screen p-3">
    <div></div>
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
    <div class="text-right">
        <i>
            CouchMUN is in its alpha development stages.<br>
            If you catch any bugs, report them to <a class="anchor" href="https://github.com/gtmun/couchmun/">its repository</a>.
        </i>
    </div>
</div>
