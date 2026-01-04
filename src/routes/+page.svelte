<!-- @component The front page. -->
<script lang="ts">
    import { resolve } from "$app/paths";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import { a11yLabel } from "$lib/util";
    import MdiGear from "~icons/mdi/gear";
</script>

<MetaTags
    title="CouchMUN"
    description="A tool to support chairs of Model UN committees in keeping time, overseeing debate, and managing delegates."
/>

<div class="flex flex-col justify-between h-screen p-3">
    <div></div>
    <div class="flex flex-col justify-center h-screen gap-3">
        <h1 class="h1 font-bold text-center">CouchMUN</h1>
    
        <!-- Entry buttons -->
        <div class="flex justify-center gap-3">
            <a class="btn preset-filled-primary-500" href="{resolve("/dashboard")}">
                Open Dashboard
            </a>
            <a 
                class="btn-icon-std preset-filled-primary-500" 
                href="{resolve("/admin/settings")}"
                {...a11yLabel("Settings")}
            >
                <MdiGear />
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
