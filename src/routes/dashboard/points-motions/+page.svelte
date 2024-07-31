<script lang="ts">
  type Motion = {
    kind: "mod", 
    totalTime: number,
    speakingTime: number,
    topic: string
  } | {
    kind: "unmod",
    totalTime: number,
    topic: string
  } | {
    kind: "other",
    totalTime: number,
    topic: string
  }
  type MotionKind = Motion["kind"];

  let currentMotion: Partial<Motion> = {
    kind: "mod"
  };
  let motions: Motion[] = [];

  function mkToStr(m: MotionKind) {
    switch (m) {
      case "mod": return "Moderated Caucus"
      case "unmod": return "Unmoderated Caucus"
      case "other": return "Other"
      default: throw new Error("no motion type " + m);
    }
  }
  // TODO: remove redundancy between this and Timer.svelte
  function timeString(secsElapsed: number): string {
    let sec = secsElapsed % 60;
    let min = Math.floor(secsElapsed / 60);
    let hr;
    let day;

    if (min >= 60) {
        hr = Math.floor(min / 60);
        min %= 60;

        if (hr >= 24) {
            day = Math.floor(hr / 24);
            hr %= 24;
        }
    }
    
    return [day, hr, min, sec]
        .filter(n => typeof n != "undefined")
        .map(n => String(n).padStart(2, '0'))
        .join(':');
  }
  function totalNumOfSpeakers(totalTime: number | undefined, speakingTime: number | undefined): number {
    if (typeof totalTime === "undefined") return 0;
    if (typeof speakingTime === "undefined") return 0;
    return totalTime / speakingTime;
  }
</script>

<!-- Input fields to set the topic and time for the moderated caucus -->
<div>
  <select bind:value={currentMotion.kind}>
    <option value="mod">Moderated Caucus</option>
    <option value="unmod">Unmoderated Caucus</option>
    <option value="other">Other</option>
  </select>
  <div>
    Total Time:
    <input inputmode="numeric" placeholder="# of seconds" bind:value={currentMotion.totalTime} required>
  </div>
  {#if currentMotion.kind === "mod"}
  <div>
    Speaking Time:
    <input inputmode="numeric" placeholder="# of seconds" bind:value={currentMotion.speakingTime} required>
  </div>
  {/if}
  <div>
    Topic:
    <input bind:value={currentMotion.topic}>
  </div>
  {#if currentMotion.kind === "mod"}
  <div>
    Total number of speakers: {totalNumOfSpeakers(currentMotion.totalTime, currentMotion.speakingTime)}
  </div>
  {/if}

  <button type="submit" on:click={() => motions = [...motions, {...currentMotion}]}>Add</button>
</div>

<hr>

<h3>
  Current List of Motions:
</h3>

<table id="motion-table">
  <thead>
    <tr>
      <td>Motion</td>
      <td>Topic</td>
      <td>Total Time</td>
      <td>Speaking Time</td>
      <td>Total # of Speakers</td>
    </tr>
  </thead>
  <tbody>
    {#each motions as motion}
      <tr>
        <td>{mkToStr(motion.kind)}</td>
        <td>{motion.topic}</td>
        <td>{timeString(motion.totalTime)}</td>
        <td>{motion.kind === "mod" ? timeString(motion.speakingTime) : ""}</td>
        <td>{motion.kind === "mod" ? Math.floor(motion.totalTime / motion.speakingTime) : ""}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  /* TODO: color + general design */
  #motion-table td {
    border: 1px solid black;
  }
</style>