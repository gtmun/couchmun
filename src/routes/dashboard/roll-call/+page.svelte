<script lang="ts">
    import { base } from "$app/paths";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import IconLabel from "$lib/components/IconLabel.svelte";
    import { db } from "$lib/db";
    import { getSessionDataContext } from "$lib/stores/session";
    import { RadioGroup, RadioItem } from "@skeletonlabs/skeleton";

    const { delegates } = getSessionDataContext();

    const radio = [
        { presence: "NP", label: "Absent", icon: "mdi:account-off" },
        { presence: "P",  label: "Present", icon: "mdi:account" },
        { presence: "PV", label: "Present and Voting", icon: "mdi:account-check" },
    ] as const;
</script>

<!-- Render a table to display participants and their statuses -->
{#if $delegates.length}
<div class="card grid">
    {#each $delegates as attrs, i (attrs.id)}
        <div class="grid grid-cols-subgrid col-span-2 even:bg-surface-100-800-token odd:bg-surface-200-700-token">
            <div class="flex items-center p-4">
                <DelLabel {attrs} inline />
            </div>
            <div class="flex flex-col justify-center p-2">
                <RadioGroup active="variant-filled-primary" hover="hover:variant-soft-primary" border="" background="bg-surface-300-600-token">
                    {#each radio as { presence, label, icon }}
                        <RadioItem group={$delegates[i].presence} name="presence-{attrs.id}" value={presence} onchange={() => db.updateDelegate(attrs.id, { presence })}>
                            <IconLabel {icon} {label} />
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