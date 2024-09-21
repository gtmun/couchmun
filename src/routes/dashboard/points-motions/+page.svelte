<script lang="ts">
  import { base } from "$app/paths";
  import LabeledSlideToggle from "$lib/components/LabeledSlideToggle.svelte";
  import DelPopup, { defaultPlaceholder, defaultPopupSettings } from "$lib/components/del-input/DelPopup.svelte";
  import { MOTION_FIELDS, MOTION_LABELS, createMotionSchema } from "$lib/motions/definitions";
  import { formatValidationError } from "$lib/motions/form_validation";
  import { compareMotions as motionComparator } from "$lib/motions/sort";
  import { getSessionDataContext } from "$lib/stores/session";
  import type { Motion } from "$lib/types";
  import { sortable } from "$lib/util";
  import { addColons, parseTime, stringifyTime } from "$lib/util/time";

  import Icon from "@iconify/svelte";
  import { popup } from "@skeletonlabs/skeleton";
  import type { z } from "zod";

  const { settings: { delegateAttributes, sortOrder }, motions, presentDelegates, selectedMotion } = getSessionDataContext();

  type Formify<T> = T extends number ? `${T}` : T;
  // acts like Partial<O>, but: 
  //    extends across unions,
  //    stringifies any non-string parameters, and
  //    allows for required values.
  type Form<O extends {}, Require extends keyof O = never> = O extends {} 
    ? 
      {[P in keyof O]?: Formify<O[P]> } &
      {[P in Require]:  Formify<O[P]> }
    : never;
  let inputMotion: Form<Motion, "kind"> = defaultInputMotion();
  let inputError: z.ZodIssue | undefined = undefined;

  function numSpeakersStr(totalTime: number | string | undefined, speakingTime: number | string | undefined): string | undefined {
    // Parse arguments as either seconds or time string.
    if (typeof totalTime === "string") totalTime = parseTime(totalTime);
    if (typeof speakingTime === "string") speakingTime = parseTime(speakingTime);

    // Handle undefined cases
    if (typeof totalTime === "undefined") return;
    if (typeof speakingTime === "undefined") return;
    
    let nSpeakers = totalTime / speakingTime;
    // Simple validation
    if (!Number.isFinite(nSpeakers)) return;
    if (nSpeakers < 0) return;
    if (!Number.isInteger(nSpeakers)) return nSpeakers.toFixed(2);
    return nSpeakers.toString();
  }

  /**
   * Filters union type M to all options which include all entries of Fs as a field.
   */
  type WithFields<M, Fs extends string> = Extract<M, Record<Fs, unknown>>;
  /**
   * Returns true if the inputMotion's kind has the provided fields.
   * This is useful for conditionally showing a field input only if the motion requires that field.
   * 
   * @param m the input motion
   * @param fields the list of fields to check for
   */
  function hasField<F extends string>(m: typeof inputMotion, fields: F[]): m is Form<WithFields<Motion, F>, "kind"> {
    const motionFields: readonly string[] = MOTION_FIELDS[m.kind];
    return fields.every(f => motionFields.includes(f));
  }
  /**
   * Produces a value by using the callback (if the provided motion has the required fields) 
   * or using a default (if the provided motion does not have the required fields).
   * @param m the motion
   * @param fields the list of fields to check for
   * @param cb the callback to produce a value (if the motion has the required fields)
   * @param dflt the default value (if the motion does not have the required fields)
   */
  function apply<M extends {}, F extends string, R>(
    m: M, 
    fields: F[], 
    cb: (m: WithFields<M, F>) => R | undefined, 
    dflt: R
  ): R {
    if (fields.every(f => f in m)) return cb(m as any) ?? dflt;
    return dflt;
  }
  
  // MOTION FORM CHANGES
  const motionSchema = createMotionSchema($delegateAttributes, $presentDelegates);
  function defaultInputMotion(): typeof inputMotion {
    return { kind: "mod" };
  }
  function resetInputErrors() {
    inputError = undefined;
  }
  function submitMotion() {
    const result = motionSchema.safeParse(inputMotion);
    if (result.success) {
      inputMotion = defaultInputMotion();
      inputError = undefined;

      motions.update($m => {
        $m.push(result.data);
        return $m;
      });
    } else {
      inputError = formatValidationError(result.error);
    }
  }

  function motionName(m: Motion) {
    const kindLabel = MOTION_LABELS[m.kind] ?? "-";
    const extension = "isExtension" in m && m.isExtension;
    
    return kindLabel + (extension ? ' (Extension)': '');
  }

  // Extension handling.
  // All of this kinda sucks.
  function isExtending(m: typeof inputMotion) {
    return "isExtension" in m && m.isExtension && m.kind === $selectedMotion?.kind;
  }
  function trySet(m: typeof inputMotion, field: string, value: (mapper: any) => any = t => t) {
    if ($selectedMotion && $selectedMotion.kind === m.kind && field in $selectedMotion) {
      (m as any)[field] = value(($selectedMotion as any)[field]);
    }
  }
  // If extension, disable "topic" and "speakingTime":
  $: if ((inputMotion as any).isExtension && $selectedMotion) {
    trySet(inputMotion, "topic");
    trySet(inputMotion, "speakingTime", t => stringifyTime(t));
  }
  // MOTION BUTTONS
  function removeMotion(i: number) {
    motions.update($m => {
      $m.splice(i, 1);
      return $m;
    })
  }
  function selectMotion(motion: Motion) {
    $selectedMotion = motion;
    $motions = [];
  }
  function sortMotions() {
    $motions = $motions.sort(motionComparator($sortOrder));
  }

  // INPUT BLUR HANDLER
  function timeBlur<A extends string>(attr: A) {
    if (attr in inputMotion) {
      (inputMotion as any)[attr] = addColons((inputMotion as any)[attr] ?? "");
    }
  }
</script>

<div class="grid gap-5 sm:grid-cols-[1fr_2fr] h-full">
  <form on:submit|preventDefault={submitMotion} on:input={resetInputErrors} class="flex flex-col gap-3 card p-3 motion-form">
    <!-- Motion input form -->
    <label class="label">
      <span>Delegation</span>
      <input 
        class="input"
        class:input-error={inputError?.path.includes("delegate")}
        bind:value={inputMotion.delegate}
        required
        use:popup={defaultPopupSettings("delegateInputPopup")}
        {...defaultPlaceholder($presentDelegates.length === 0)}
      >
    </label>
    <label class="label">
      <span>Motion</span>
      <select 
        class="select" 
        class:input-error={inputError?.path.includes("kind")}
        bind:value={inputMotion.kind}
        on:change={() => inputMotion = { delegate: inputMotion.delegate, kind: inputMotion.kind }}
      >
        {#each Object.entries(MOTION_LABELS) as [value, label]}
          <option {value} {label} />
        {/each}
      </select>
    </label>
    {#if hasField(inputMotion, ["totalTime"])}
    <label class="label">
      <span>Total Time</span>
      <input 
        class="input" 
        placeholder="mm:ss" 
        class:input-error={inputError?.path.includes("totalTime")}
        bind:value={inputMotion.totalTime}
        on:blur={() => timeBlur("totalTime")}
        required
      >
    </label>
    {/if}
    {#if hasField(inputMotion, ["speakingTime"])}
    <label class="label">
      <span>Speaking Time</span>
      <input 
        class="input" 
        placeholder="mm:ss" 
        class:input-error={inputError?.path.includes("speakingTime")}
        bind:value={inputMotion.speakingTime}
        on:blur={() => timeBlur("speakingTime")}
        disabled={isExtending(inputMotion)}
      >
    </label>
    {/if}
    {#if hasField(inputMotion, ["topic"])}
      <label class="label">
        <span>Topic</span>
        <input 
          class="input" 
          class:input-error={inputError?.path.includes("topic")}
          bind:value={inputMotion.topic}
          disabled={isExtending(inputMotion)}
        >
      </label>
    {/if}
    {#if hasField(inputMotion, ["isExtension"]) && $selectedMotion?.kind === inputMotion.kind}
      <LabeledSlideToggle name="extension-toggle" bind:checked={inputMotion.isExtension}>
        <span>Extend previous motion?</span>
      </LabeledSlideToggle>
    {/if}
    {#if hasField(inputMotion, ["totalTime", "speakingTime"])}
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
      <div class="text-error-500 text-center">{inputError.message}</div>
    {/if}

    <!-- Delegate autocomplete popup -->
    <DelPopup
      popupID="delegateInputPopup"
      bind:input={inputMotion.delegate}
      delegates={$delegateAttributes}
      presentDelegates={$presentDelegates}
      on:selection={e => {inputMotion.delegate = e.detail.label; resetInputErrors()}}
    />
  </form>
  
  <div class="flex flex-col gap-2">
    <div class="grid grid-cols-[1fr_auto] items-center">
      <h3 class="h3 text-center">List of Motions</h3>
      <button class="btn btn-icon" on:click={sortMotions}>
        <Icon icon="mdi:sort" width="24" height="24" />
      </button>
    </div>
    
    <div class="table-container">
      <table class="table motion-table">
        <thead>
          <tr>
            <td class="w-24"></td>
            <td class="px-3 w-24">Motion</td>
            <td class="px-3 w-32">By</td>
            <td class="px-3">Topic</td>
            <td class="px-3 w-24">Total Time</td>
            <td class="px-3 w-24">Speaking Time</td>
            <td class="px-3 w-24">No. of Speakers</td>
          </tr>
        </thead>
        <tbody use:sortable={{
          animation: 150,
          ghostClass: "!bg-surface-400/25",
          dragClass: "!bg-surface-50",
          fallbackOnBody: true,
          store: {
            get: () => Object.keys(Array.from({ length: $motions.length })),
            set: (sortable) => motions.update($m => sortable.toArray().map(k => $m[+k]))
          }
        }}>
          {#each $motions as motion, i (motion)}
            <tr data-id={i}>
              <td>
                <div class="flex flex-row">
                  <button class="btn btn-sm btn-icon" on:click={() => removeMotion(i)}>
                    <Icon icon="mdi:cancel" width="24" height="24" class="text-error-500" />
                  </button>
                  <a class="btn btn-sm btn-icon" on:click={() => selectMotion(motion)} href="{base}/dashboard/current-motion">
                    <Icon icon="mdi:check" width="24" height="24"  class="text-success-700" />
                  </a>
                </div>
              </td>
              <td>{motionName(motion)}</td>
              <td>{$delegateAttributes[motion.delegate].name}</td>
              <td>{apply(motion, ["topic"], m => m.topic, "-")}</td>
              <td>{apply(motion, ["totalTime"], m => stringifyTime(m.totalTime), "-")}</td>
              <td>{apply(motion, ["speakingTime"], m => stringifyTime(m.speakingTime), "-")}</td>
              <td>{apply(motion, ["totalTime", "speakingTime"], m => numSpeakersStr(m.totalTime, m.speakingTime), "-")}</td>
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
    justify-content: space-between;
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