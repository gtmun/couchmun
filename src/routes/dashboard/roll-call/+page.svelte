<script lang="ts">
  import { SESSION_DATA_KEY } from "$lib/dashboard/stores";
  import type { SessionData } from "$lib/dashboard/types";
  import { getContext } from "svelte";

  const { settings: { delegateAttributes }, delegateAttendance } = getContext<SessionData>(SESSION_DATA_KEY);
</script>

<!-- Render a table to display participants and their statuses -->
<div class="table-container">
  <table class="table table-compact">
    <thead>
      <tr>
        <th>Delegate</th>
        <th class="w-1/4">Present</th>
        <th class="w-1/4">Present and Voting</th>
      </tr>
    </thead>
    <tbody>
      {#each Object.keys($delegateAttributes) as key}
        {@const presence = $delegateAttendance[key] ??= "NP"}
        <tr>
          <td>{$delegateAttributes[key].name}</td>
          <td 
            class="data-cell"
            class:selected={presence != "NP"}
          >
            <button 
              class="w-full h-full"
              on:click={() => $delegateAttendance[key] = presence === "NP" ? "P" : "NP"}
            />
          </td>
          <td 
            class="data-cell"
            class:selected={presence === "PV"}
          >
            <button 
              class="w-full h-full"
              on:click={() => $delegateAttendance[key] = presence === "PV" ? "P" : "PV"}
            />
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  td.data-cell {
    border-left-width: 1px;
    border-left-color: rgb(var(--color-surface-500) / 0.2);
    transition: background-color 0.2s;
    padding: 0 !important;
    /**
      Actually stupid, but whatever.
      The attributes below allow h-full on button to apply,
      allowing the button to expand the entire table cell.

      It does not actually affect the height of the table.
    */
    height: 0;
    min-height: 0;
  }
  td.data-cell.selected {
    background-color: rgba(var(--color-primary-500));
  }
  td.data-cell:hover {
    background-color: rgba(var(--color-primary-500) / 0.25);
  }
  td.data-cell.selected:hover {
    background-color: rgba(var(--color-primary-500) / 0.75);
  }
</style>