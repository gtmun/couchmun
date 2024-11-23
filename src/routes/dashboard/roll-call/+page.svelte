<script lang="ts">
    import { base } from "$app/paths";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import { getSessionDataContext } from "$lib/stores/session";
    import { mapObj } from "$lib/util";
    import { RadioGroup, RadioItem } from "@skeletonlabs/skeleton";

    const { settings: { delegateAttributes }, delegateAttendance } = getSessionDataContext();
    delegateAttributes.subscribe($da => {
        $delegateAttendance = mapObj($da, k => [k, $delegateAttendance[k] ?? "NP"]);
    });
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
                    <RadioItem bind:group={$delegateAttendance[key]} name="presence-{key}" value={"NP"}>Absent</RadioItem>
                    <RadioItem bind:group={$delegateAttendance[key]} name="presence-{key}" value={"P"}>Present</RadioItem>
                    <RadioItem bind:group={$delegateAttendance[key]} name="presence-{key}" value={"PV"}>Present and Voting</RadioItem>
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