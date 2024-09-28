<script lang="ts">
  import DelLabel from "$lib/components/DelLabel.svelte";
  import { getSessionDataContext } from "$lib/stores/session";
  import { RadioGroup, RadioItem } from "@skeletonlabs/skeleton";

  const { settings: { delegateAttributes }, delegateAttendance } = getSessionDataContext();
</script>

<!-- Render a table to display participants and their statuses -->
<div class="card grid grid-cols-[1fr-1fr]">
  {#each Object.keys($delegateAttributes) as key}
    {@const _presence = $delegateAttendance[key] ??= "NP"}
    <div class="grid grid-cols-subgrid col-span-2 even:bg-surface-100-800-token odd:bg-surface-200-700-token">
      <div class="flex items-center p-4">
          <DelLabel {key} inline />
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
