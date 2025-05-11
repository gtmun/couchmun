<!-- 
  @component The page for roll call, 
    which consists of a long list of delegates and an option to select NP/P/PV.
-->
<script lang="ts">
    import { base } from "$app/paths";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import IconLabel from "$lib/components/IconLabel.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { db } from "$lib/db/index.svelte";
    import { Segment } from "@skeletonlabs/skeleton-svelte";
    import MdiAccountOff from "~icons/mdi/account-off";
    import MdiAccount from "~icons/mdi/account";
    import MdiAccountCheck from "~icons/mdi/account-check";
    import type { DelegatePresence } from "$lib/types";

    const { delegates } = getSessionContext();

    const radio = [
        { presence: "NP", label: "Absent", icon: MdiAccountOff },
        { presence: "P",  label: "Present", icon: MdiAccount },
        { presence: "PV", label: "Present and Voting", icon: MdiAccountCheck },
    ] as const;

    function asPresence(s?: string | null): DelegatePresence {
        if (s === "P" || s === "PV") return s;
        return "NP";
    }
</script>

<!-- Render a table to display participants and their statuses -->
{#if $delegates.length}
<div class="card grid">
    {#each $delegates as attrs, i (attrs.id)}
        <div class="grid grid-cols-subgrid col-span-2 even:bg-surface-100-900 odd:bg-surface-200-800">
            <div class="flex items-center p-4">
                <DelLabel {attrs} inline />
            </div>
            <div class="flex flex-col justify-center p-2">
                <Segment name="presence-{attrs.id}" value={$delegates[i].presence} onValueChange={e => db.updateDelegate(attrs.id, { presence: asPresence(e.value) })}>
                    {#each radio as { presence, label, icon }}
                        <Segment.Item value={presence}>
                            <IconLabel {icon} {label} />
                        </Segment.Item>
                    {/each}
                </Segment>
            </div>
        </div>
    {/each}
</div>
{:else}
<div class="h-full w-full flex flex-col items-stretch justify-center">
    <div class="text-center">
        <h3 class="h3">No delegates enabled.</h3>
            Visit 
            <a
                class="btn btn-sm preset-tonal-warning"
                href="{base}/admin/settings"
                tabindex="0"
            >
                Settings
            </a>
        to configure delegates.
    </div>
</div>
{/if}