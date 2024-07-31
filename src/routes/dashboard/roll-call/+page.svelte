<script lang="ts">
  // TODO: probably link this to a config setting of some sort
  import delegateData from "$lib/sample_delegates.json";

  type DelegateName = keyof typeof delegateData;
  type DelegateStatus = {
    status: "NP" | "P" | "PV"
  };

  let delegates: Record<DelegateName, DelegateStatus> = Object.fromEntries(
    Object.keys(delegateData).map(p => [p, { status: "NP" }])
  ) as any;

  let maj: number, supermaj: number, total: number;
  $: {
    total = Object.values(delegates)
      .filter(st => st.status !== "NP")
      .length;
    maj = Math.ceil(total / 2);
    supermaj = Math.ceil(total * 2 / 3);
  }
  </script>
<div>
  <div><b>Majority (1/2)</b>: {maj}</div>
  <div><b>Supermajority (2/3)</b>: {supermaj}</div>
  <div><b>Total Present</b>: {total}</div>
</div>
<!-- Render a table to display participants and their statuses -->
<table>
  <thead>
    <tr>
      <th>Delegate</th>
      <th>Present</th>
      <th>Present and Voting</th>
    </tr>
  </thead>
  <tbody id="del-table">
    {#each Object.entries(delegates) as [dName, dStatus]}
      <tr>
        <td>{dName}</td>
        <td on:click={() => dStatus.status = dStatus.status === "NP" ? "P" : "NP"} class:highlight={dStatus.status != "NP"}>
        </td>
        <td on:click={() => dStatus.status = dStatus.status === "PV" ? "P" : "PV"}  class:highlight={dStatus.status == "PV"}>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  /* TODO: color + general design */
  #del-table td {
    border: 1px solid black;
  }
  #del-table td {
    transition: background-color 0.2s;
  }
  .highlight {
    background-color: lightgreen;
  }
  td:hover {
    background-color: color-mix(in srgb, lightgreen 30%, transparent);
  }
  td:hover.highlight {
    background-color: color-mix(in srgb, lightgreen 70%, transparent);
  }
</style>