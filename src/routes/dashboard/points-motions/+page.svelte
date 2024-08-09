<script lang="ts">
  import { createMotionSchema } from "$lib/dashboard/points-motions/form_validation";
  import _delegates from "$lib/sample_delegates.json";
  import { parseTime, stringifyTime } from "$lib/time";
  import type { DelegateMap, Motion, MotionKind, SessionData } from "$lib/dashboard/types";
  import { getContext, onMount } from "svelte";

  import { ValidationError } from "yup";
  import Icon from "@iconify/svelte";
  import DelPopup, { defaultPlaceholder, defaultPopupSettings } from "$lib/dashboard/DelPopup.svelte";
  import { popup } from "@skeletonlabs/skeleton";
  import Sortable from "sortablejs";

  let delegates: DelegateMap = _delegates;
  const { motions, presentDelegates, selectedMotion } = getContext<SessionData>("sessionData");

  let inputMotion: Partial<Motion> = defaultInputMotion();
  let inputError: { id: string, msg: string } | undefined = undefined;

  let tableBody: HTMLTableSectionElement;
  onMount(async() => {
    Sortable.create(tableBody, {
      animation: 150,
      ghostClass: "!bg-surface-400/25",
      fallbackOnBody: true
    });
  });

  // STRING DISPLAY
  function mkToStr(m: MotionKind) {
    switch (m) {
      case "mod": return "Moderated Caucus"
      case "unmod": return "Unmoderated Caucus"
      case "other": return "Other"
      default: throw new Error("no motion type " + m);
    }
  }
  function numSpeakersStr(totalTime: number | string | undefined, speakingTime: number | string | undefined): number | string | undefined {
    // Parse arguments as either seconds or time string.
    if (typeof totalTime === "string") {
      totalTime = Number.isInteger(+totalTime) ? +totalTime : parseTime(totalTime);
    }
    if (typeof speakingTime === "string") {
      speakingTime = Number.isInteger(+speakingTime) ? +speakingTime : parseTime(speakingTime);
    }

    // Handle undefined cases
    if (typeof totalTime === "undefined") return;
    if (typeof speakingTime === "undefined") return;

    let nSpeakers = totalTime / speakingTime;
    // Simple validation
    if (!Number.isFinite(nSpeakers)) return;
    if (nSpeakers < 0) return;
    if (!Number.isInteger(nSpeakers)) return nSpeakers.toFixed(2);
    return nSpeakers;
  }

  // MOTION FORM CHANGES
  const motionSchema = createMotionSchema(delegates, $presentDelegates);
  function defaultInputMotion(): Partial<Motion> {
    return { kind: "mod" };
  }
  function resetInputErrors() {
    inputError = undefined;
  }
  function submitMotion() {
    let validatedMotion;
    try {
      validatedMotion = motionSchema.validateSync(inputMotion) as unknown as Motion;
    } catch (e) {
      // Failure
      if (e instanceof ValidationError) {
        inputError = { id: e.path ?? "", msg: e.message };
        return;
      } else {
        throw e;
      }
    }

    // Success
    inputMotion = defaultInputMotion();
    inputError = undefined;
    motions.update(m => {
      m.push(validatedMotion);
      return m;
    })
  }

  // MOTION BUTTONS
  function removeMotion(i: number) {
    motions.update(m => {
      m.splice(i, 1);
      return m;
    })
  }
  function selectMotion(motion: Motion) {
    $selectedMotion = motion;
    $motions = [];
  }
</script>

<div class="grid gap-5 sm:grid-cols-[1fr_2fr] h-full">
  <form on:submit|preventDefault={submitMotion} on:input={resetInputErrors} class="flex flex-col gap-3 card p-3 motion-form">
    <!-- Motion input form -->
    <label class="label">
      <span>Delegation</span>
      <input 
        class="input"
        class:input-error={inputError?.id === "delegate"}
        bind:value={inputMotion.delegate}
        required
        use:popup={defaultPopupSettings("delegateInputPopup")}
        {...defaultPlaceholder($presentDelegates)}
      >
    </label>
    <label class="label">
      <span>Motion</span>
      <select 
        class="select" 
        class:input-error={inputError?.id === "kind"} 
        bind:value={inputMotion.kind}
      >
        <option value="mod">Moderated Caucus</option>
        <option value="unmod">Unmoderated Caucus</option>
        <option value="other">Other</option>
      </select>
    </label>
    <label class="label">
      <span>Total Time</span>
      <input 
        class="input" 
        class:input-error={inputError?.id === "totalTime"}
        placeholder="mm:ss" bind:value={inputMotion.totalTime} 
        required
      >
    </label>
    {#if inputMotion.kind === "mod"}
    <label class="label">
      <span>Speaking Time</span>
      <input 
        class="input" 
        placeholder="mm:ss" 
        class:input-error={inputError?.id === "speakingTime"}
        bind:value={inputMotion.speakingTime}
        required
      >
    </label>
    {/if}
    {#if inputMotion.kind === "mod" || inputMotion.kind === "other"}
      <label class="label">
        <span>Topic</span>
        <input 
          class="input" 
          class:input-error={inputError?.id === "topic"}
          bind:value={inputMotion.topic}
          required
        >
      </label>
    {/if}
    {#if inputMotion.kind === "mod"}
    <div class="text-center">
      <strong>Number of speakers</strong>: {numSpeakersStr(inputMotion.totalTime, inputMotion.speakingTime) ?? '-'}
    </div>
    {/if}

    <button 
      class="btn variant-filled-primary" 
      type="submit"
    >
      Add
    </button>
    {#if typeof inputError !== "undefined"}
      <div class="text-error-500 text-center">{inputError.msg}</div>
    {/if}

    <!-- Delegate autocomplete popup -->
    <DelPopup
      popupID="delegateInputPopup"
      bind:input={inputMotion.delegate}
      {delegates}
      presentDelegates={$presentDelegates}
      on:selection={e => {inputMotion.delegate = e.detail.label; resetInputErrors()}}
    />
  </form>
  
  <div class="flex flex-col gap-2">
    <h3 class="h3">List of Motions</h3>
    
    <div class="table-container">
      <table class="table table-fixed motion-table">
        <thead>
          <tr>
            <td class="w-24"></td>
            <td class="px-3">Motion</td>
            <td class="px-3">By</td>
            <td class="px-3">Topic</td>
            <td class="px-3">Total Time</td>
            <td class="px-3">Speaking Time</td>
            <td class="px-3">No. of Speakers</td>
          </tr>
        </thead>
        <tbody bind:this={tableBody}>
          {#each $motions as motion, i}
            <tr>
              <td>
                <div class="flex flex-row">
                  <button class="btn btn-sm btn-icon" on:click={() => removeMotion(i)}>
                    <Icon icon="mdi:cancel" width="24" height="24" class="text-error-500" />
                  </button>
                  <a class="btn btn-sm btn-icon" on:click={() => selectMotion(motion)} href="/dashboard/motion">
                    <Icon icon="mdi:check" width="24" height="24"  class="text-success-700" />
                  </a>
                </div>
              </td>
              <td>{mkToStr(motion.kind)}</td>
              <td>{delegates[motion.delegate].name}</td>
              <td>{motion.kind !== "unmod" ? motion.topic : "-"}</td>
              <td>{stringifyTime(motion.totalTime)}</td>
              <td>{motion.kind === "mod" ? stringifyTime(motion.speakingTime) : "-"}</td>
              <td>{motion.kind === "mod" ? numSpeakersStr(motion.totalTime, motion.speakingTime) ?? '-' : "-"}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
  .motion-form label {
    display: flex;
    align-items: center;
  }
  .motion-form label :first-child {
    width: 33.3%;
  }
  .motion-form label :nth-child(2) {
    width: 66.7%;
  }

  .motion-table td {
    vertical-align: middle;
  }
  .motion-table tbody {
    cursor: grab;
  }

  /* If we're NOT dragging an item, enable the hover effect. */
  .motion-table tbody:not(:has(> [draggable="true"])) tr:hover:not(:active) {
    background-color: rgba(var(--color-primary-500) / 0.25) !important;
  }
</style>