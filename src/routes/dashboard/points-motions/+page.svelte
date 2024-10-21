<script lang="ts">
  import { base } from "$app/paths";
  import DelLabel from "$lib/components/del-label/DelLabel.svelte";
  import MotionForm, { numSpeakersStr } from "$lib/components/MotionForm.svelte";
  import EditMotionCard from "$lib/components/modals/EditMotionCard.svelte";
  import { MOTION_LABELS } from "$lib/motions/definitions";
  import { compareMotions as motionComparator } from "$lib/motions/sort";
  import { getSessionDataContext } from "$lib/stores/session";
  import { getStatsContext, updateStats } from "$lib/stores/stats";
  import type { Motion } from "$lib/types";
  import { sortable } from "$lib/util";
  import { stringifyTime } from "$lib/util/time";

  import Icon from "@iconify/svelte";
  import { getModalStore } from "@skeletonlabs/skeleton";
  import { flip } from "svelte/animate";

  const { settings: { delegateAttributes, sortOrder }, motions, selectedMotion } = getSessionDataContext();
  const { stats } = getStatsContext();
  const modalStore = getModalStore();

  function submitMotion(motion: Motion) {
    motions.update($m => {
      $m.push(motion);
      return $m;
    });
    updateStats(stats, motion.delegate, dat => dat.motionsProposed++);
  }

  /**
   * Filters union type M to all options which include all entries of Fs as a field.
   */
  type WithFields<M, Fs extends string> = Extract<M, Record<Fs, unknown>>;
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


  function motionName(m: Motion) {
    const kindLabel = MOTION_LABELS[m.kind] ?? "-";
    const extension = "isExtension" in m && m.isExtension;
    
    return kindLabel + (extension ? ' (Extension)': '');
  }

  // MOTION BUTTONS
  function removeMotion(i: number) {
    motions.update($m => {
      $m.splice(i, 1);
      return $m;
    })
  }
  function acceptMotion(motion: Motion) {
    $selectedMotion = motion;
    $motions = [];
    updateStats(stats, motion.delegate, dat => dat.motionsAccepted++);
  }
  function editMotion(i: number, motion: Motion) {
    modalStore.trigger({
        type: "component",
        component: {
            ref: EditMotionCard,
            props: { motion }
        },
        response(motion?: Motion) {
          if (!motion) return;
          motions.update($m => {
            updateStats(stats, $m[i].delegate, dat => dat.motionsProposed--);
            updateStats(stats, motion.delegate, dat => dat.motionsProposed++);
            $m[i] = motion;
            return $m;
          });
        }
    });
  }
  function sortMotions() {
    $motions = $motions.sort(motionComparator($sortOrder));
  }
</script>

<div class="grid gap-5 sm:grid-cols-[1fr_2fr] h-full">
  <div class="card motion-form">
    <MotionForm submit={submitMotion} />
  </div>
  
  <div class="flex flex-col gap-2">
    <div class="grid grid-cols-[1fr_auto] items-center">
      <h3 class="h3 text-center">List of Motions</h3>
      <button
        class="btn btn-icon variant-ghost-primary hover:variant-filled-primary"
        onclick={sortMotions}
        aria-label="Sort Motions"
        title="Sort Motions"
      >
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
            {@const delName = $delegateAttributes[motion.delegate]?.name ?? motion.delegate}
            <tr data-id={i} animate:flip={{ duration: 300 }}>
              <td>
                <div class="flex flex-row">
                  <button
                    class="btn btn-sm btn-icon"
                    onclick={() => removeMotion(i)}
                    data-label="Reject {delName}'s Motion"
                    title="Reject {delName}'s Motion"
                  >
                    <Icon icon="mdi:cancel" width="24" height="24" class="text-error-500" />
                  </button>
                  <a
                    class="btn btn-sm btn-icon"
                    onclick={() => acceptMotion(motion)}
                    href="{base}/dashboard/current-motion"
                    data-label="Accept {delName}'s Motion"
                    title="Accept {delName}'s Motion"
                    tabindex={0}
                  >
                    <Icon icon="mdi:check" width="24" height="24" class="text-success-700" />
                  </a>
                  <button
                    class="btn btn-sm btn-icon"
                    onclick={() => editMotion(i, motion)}
                    data-label="Edit {delName}'s Motion"
                    title="Edit {delName}'s Motion"
                  >
                    <Icon icon="mdi:pencil" width="24" height="24" />
                  </button>
                </div>
              </td>
              <td>{motionName(motion)}</td>
              <td><DelLabel key={motion.delegate} attrs={$delegateAttributes[motion.delegate]} inline /></td>
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
  .motion-table td {
    vertical-align: middle;
  }
  .motion-table tbody {
    cursor: grab;
  }

  /* If we're NOT dragging an item, enable the hover effect. */
  .motion-table tbody:not(:has(> :global(.sortable-chosen))) tr:hover:not(:active) {
    background-color: rgba(var(--color-primary-500) / 0.25) !important;
  }
</style>