<script lang="ts">
    import { base } from "$app/paths";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import { getSessionDataContext } from "$lib/stores/session";
    import type { DelegatePresence } from "$lib/types";
    import { mapObj } from "$lib/util";
    import Icon from "@iconify/svelte";
    import { RadioGroup, RadioItem } from "@skeletonlabs/skeleton";

    const { settings: { delegateAttributes }, delegateAttendance } = getSessionDataContext();
    delegateAttributes.subscribe($da => {
        $delegateAttendance = mapObj($da, k => [k, $delegateAttendance[k] ?? "NP"]);
    });

    const radio: Record<DelegatePresence, { label: string, icon: string }> = {
        NP: { label: "Absent", icon: "mdi:account-off" },
        P:  { label: "Present", icon: "mdi:account" },
        PV: { label: "Present and Voting", icon: "mdi:account-check" },
    };
</script>

<!-- Render a table to display participants and their statuses -->
{#if Object.keys($delegateAttributes).length}
<div class="card grid">
    {#each Object.entries($delegateAttributes) as [key, attrs] (key)}
        <div class="grid grid-cols-subgrid col-span-2 even:bg-surface-100-800-token odd:bg-surface-200-700-token">
            <div class="flex items-center p-4">
                <DelLabel {key} {attrs} inline />
            </div>
            <div class="flex flex-col justify-center p-2">
                <RadioGroup active="variant-filled-primary" hover="hover:variant-soft-primary" border="" background="bg-surface-300-600-token">
                    {#each Object.entries(radio) as [value, { label, icon }]}
                        <RadioItem bind:group={$delegateAttendance[key]} name="presence-{key}" {value}>
                            <!-- If on a small device, use an icon -->
                            <div class="flex justify-center items-center md:hidden" aria-label={label} title={label}>
                                <Icon {icon} width="24" height="24" />
                            </div>
                            <!-- If on a larger device, use the full text -->
                            <span class="hidden md:block">{label}</span>
                        </RadioItem>
                    {/each}
                </RadioGroup>
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
                class="btn btn-sm variant-soft-warning"
                href="{base}/admin/settings"
                tabindex="0"
            >
                Settings
            </a>
        to configure delegates.
    </div>
</div>
{/if}