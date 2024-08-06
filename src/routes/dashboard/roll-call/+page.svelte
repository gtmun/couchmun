<script lang="ts">
  import type { DelegateMap, DelegatePresence, SessionData } from "$lib/dashboard/types";
  import _delegates from "$lib/sample_delegates.json";
  import { getContext } from "svelte";

  const delegates: DelegateMap = _delegates;
  const { delegateAttendance } = getContext<SessionData>("sessionData");
  delegateAttendance.update(att => {
    return Object.assign(Object.fromEntries<DelegatePresence>(
      Object.keys(delegates).map(p => [p, "NP"])
    ), att);
  })
</script>

<!-- Render a table to display participants and their statuses -->
<div class="table-container">
  <table class="table table-compact">
    <thead>
      <tr>
        <th>Delegate</th>
        <th>Present</th>
        <th>Present and Voting</th>
      </tr>
    </thead>
    <tbody>
      {#each Object.entries($delegateAttendance) as [key, presence]}
        <tr>
          <td>{delegates[key].name}</td>
          <td 
            on:click={() => $delegateAttendance[key] = presence === "NP" ? "P" : "NP"}
            class="data-cell"
            class:selected={presence != "NP"}
          />
          <td 
            on:click={() => $delegateAttendance[key] = presence === "PV" ? "P" : "PV"}
            class="data-cell"
            class:selected={presence === "PV"}
          />
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  td.data-cell {
    cursor: pointer;
    border-left-width: 1px;
    border-left-color: rgb(var(--color-surface-500) / 0.2);
    transition: background-color 0.2s;
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