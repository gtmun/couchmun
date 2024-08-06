<script lang="ts">
  // TODO: probably link this to a config setting of some sort
  import delegateData from "$lib/sample_delegates.json";

  type DelegateKey = keyof typeof delegateData;
  type DelegateStatus = {
    status: "NP" | "P" | "PV"
  };

  let delegates: Record<DelegateKey, DelegateStatus> = Object.fromEntries(
    Object.keys(delegateData).map(p => [p, { status: "NP" }])
  ) as any;
  function entries<K extends string, V>(rec: Record<K, V>): [K, V][] {
    return Object.entries(rec) as [K, V][];
  }
  let maj: number, supermaj: number, total: number;
  $: {
    total = Object.values(delegates)
      .filter(st => st.status !== "NP")
      .length;
    maj = Math.ceil(total / 2);
    supermaj = Math.ceil(total * 2 / 3);
  }
  </script>
<div class="sticky card">
  <div><b>Majority (1/2)</b>: {maj}</div>
  <div><b>Supermajority (2/3)</b>: {supermaj}</div>
  <div><b>Total Present</b>: {total}</div>
</div>
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
      {#each entries(delegates) as [dKey, dStatus]}
        <tr>
          <td>{delegateData[dKey].name}</td>
          <td 
            on:click={() => dStatus.status = dStatus.status === "NP" ? "P" : "NP"}
            class="data-cell"
            class:selected={dStatus.status != "NP"}
          />
          <td 
            on:click={() => dStatus.status = dStatus.status === "PV" ? "P" : "PV"}
            class="data-cell"
            class:selected={dStatus.status === "PV"}
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