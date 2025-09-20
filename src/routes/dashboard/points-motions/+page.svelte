<!--
  @component The points & motions page (used for creating and viewing the current points & motions).

  This includes a MotionForm (which is used to add motions)
  and a sortable motion table (which is used to view and rearrange and edit motions).
-->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import DelLabel from "$lib/components/del-label/DelLabel.svelte";
  import IconLabel from "$lib/components/IconLabel.svelte";
  import MotionForm, { numSpeakersStr } from "$lib/components/MotionForm.svelte";
  import EditMotionCard from "$lib/components/modals/EditMotionCard.svelte";
  import { createSpeaker } from "$lib/components/SpeakerList.svelte";
  import { getSessionContext } from "$lib/context/index.svelte";
  import { defaultModalClasses } from "$lib/components/modals/ModalContent.svelte";
  import { db } from "$lib/db/index.svelte";
  import { findDelegate } from "$lib/db/delegates";
  import { MOTION_LABELS } from "$lib/motions/definitions";
  import { compareMotions as motionComparator } from "$lib/motions/sort";
  import type { Motion } from "$lib/types";
  import { createDragTr, isDndShadow } from "$lib/util/dnd";
  import { stringifyTime } from "$lib/util/time";
  import { Modal } from "@skeletonlabs/skeleton-svelte";
  import { flip } from "svelte/animate";
  import { dndzone } from "svelte-dnd-action";
  import MdiAccountClock from "~icons/mdi/account-clock";
  import MdiAccountMultiple from "~icons/mdi/account-multiple";
  import MdiCancel from "~icons/mdi/cancel";
  import MdiCheck from "~icons/mdi/check";
  import MdiClock from "~icons/mdi/clock";
  import MdiPencil from "~icons/mdi/pencil";
  import MdiSort from "~icons/mdi/sort";

  const { motions, selectedMotion, selectedMotionState, delegates, sortOrder } = getSessionContext();
  const pid = $props.id();

  let openModals = $state({
    editMotion: false
  });
  // A clone of $motions used solely for use:dndzone
  let dndItems = $derived($motions);

  let motionTable: HTMLTableElement | undefined = $state();

  function submitMotion(motion: Motion) {
    motions.update($m => {
      $m.push(motion);
      return $m;
    });
    db.updateDelegate(motion.delegate, d => { d.stats.motionsProposed++; });
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

  async function acceptMotion(motion: Motion) {
    // Update selected motion and initialize selected motion state:
    $selectedMotion = motion;
    if (motion.kind === "rr") {
      $selectedMotionState = { speakersList: $delegates.filter(d => d.isPresent()).map(s => createSpeaker(s.id)) };
    } else {
      $selectedMotionState = { speakersList: [] };
    }

    $motions = [];
    await db.updateDelegate(motion.delegate, d => { d.stats.motionsAccepted++; });
  }
  async function acceptMotionAndGoto(motion: Motion) {
    await acceptMotion(motion);
    goto(`${base}/dashboard/current-motion`);
  }
  function editMotion(i: number, motion?: Motion) {
    if (!motion) return;
    db.updateDelegate($motions[i].delegate, d => { d.stats.motionsProposed--; });
    db.updateDelegate(motion.delegate, d => { d.stats.motionsProposed++; });
    $motions[i] = motion;
  }
  function sortMotions() {
    $motions = $motions.sort(motionComparator($sortOrder));
  }
  // Check every window of two motions is in the right order:
  let motionsSorted = $derived.by(() => {
    try {
      return Array.from({ length: $motions.length - 1 }, (_, i) => motionComparator($sortOrder)($motions[i], $motions[i + 1]) <= 0)
        .every(b => b);
    } catch {
      // If comparing crashes, don't allow the button to do anything
      return true;
    }
  });
</script>

<div class="grid gap-5 min-h-full md:grid-cols-[1fr_2fr] md:h-full">
  <div class="card-filled motion-form">
    <MotionForm submit={submitMotion} />
  </div>
  
  <div class="flex flex-col gap-2 overflow-x-auto">
    <div class="grid grid-cols-[1fr_auto] items-center">
      <h3 class="h3 text-center" id="motion-table-header-{pid}">List of Motions</h3>
      <button
        class={["btn-icon-std transition-colors", motionsSorted ? "preset-ui-depressed" : "preset-ui-activated"]}
        onclick={sortMotions}
        aria-label="Sort Motions"
        title="Sort Motions"
        disabled={motionsSorted}
      >
        <MdiSort />
      </button>
    </div>
    
    <div class="table-wrap rounded border border-surface-200-800">
      <table class="table" bind:this={motionTable}>
        <thead class="preset-ui">
          <tr>
            <td class="px-3 w-28">Motion</td>
            <td class="px-3 w-36">By</td>
            <td class="px-3">Topic</td>
            <td class="px-3 w-16">
              <IconLabel icon={MdiClock} label="Total Time" />
            </td>
            <td class="px-3 w-16">
              <IconLabel icon={MdiAccountClock} label="Speaking Time" />
            </td>
            <td class="px-3 w-16">
              <IconLabel icon={MdiAccountMultiple} label="No. of Speakers" />
            </td>
            <td class="w-30"></td>
          </tr>
        </thead>
        <tbody
          use:dndzone={{
            items: dndItems,
            flipDurationMs: 150,
            dropTargetStyle: {},
            transformDraggedElement: (el) => createDragTr(el, motionTable)
          }}
          onconsider={(e) => dndItems = e.detail.items}
          onfinalize={(e) => $motions = dndItems = e.detail.items}
          aria-labelledby="motion-table-header-{pid}"
        >
          {#each dndItems as motion, i (motion.id)}
            {@const delAttrs = findDelegate($delegates, motion.delegate)}
            {@const delName = delAttrs?.name ?? "unknown"}
            {@const shadow = isDndShadow(motion)}
            <tr
              class={[
                "dnd-list-item hover:preset-tonal-primary",
                shadow && "visible! bg-surface-200-800!"
              ]}
              animate:flip={{ duration: 150 }}
              aria-label="{delName}'s Motion"
            >
              <td>{motionName(motion)}</td>
              <td>
                <DelLabel attrs={delAttrs} fallbackName={delName} inline />
              </td>
              <td>{apply(motion, ["topic"], m => m.topic, "-")}</td>
              <td>{'totalSpeakers' in motion ? stringifyTime(motion.totalSpeakers * motion.speakingTime) : apply(motion, ["totalTime"], m => stringifyTime(m.totalTime), "-")}</td>
              <td>{apply(motion, ["speakingTime"], m => stringifyTime(m.speakingTime), "-")}</td>
              <td>{'totalSpeakers' in motion ? motion.totalSpeakers : apply(motion, ["totalTime", "speakingTime"], m => numSpeakersStr(m.totalTime, m.speakingTime), "-")}</td>
              <td>
                <div class="flex flex-row justify-end">
                  <button
                    class="btn-icon-std p-1"
                    onclick={() => removeMotion(i)}
                    data-label="Reject {delName}'s Motion"
                    title="Reject {delName}'s Motion"
                  >
                    <MdiCancel class="text-error-500" />
                  </button>
                  <button
                    class="btn-icon-std p-1"
                    onclick={() => acceptMotionAndGoto(motion)}
                    data-label="Accept {delName}'s Motion"
                    title="Accept {delName}'s Motion"
                  >
                    <MdiCheck class="text-success-700" />
                  </button>
                  <Modal
                    open={openModals.editMotion}
                    onOpenChange={e => openModals.editMotion = e.open}
                    triggerBase="btn-icon-std p-1"
                    {...defaultModalClasses}
                  >
                    {#snippet trigger()}
                      <MdiPencil />
                    {/snippet}
                    {#snippet content()}
                      <EditMotionCard {motion} bind:open={openModals.editMotion} onSubmit={m => editMotion(i, m)} />
                    {/snippet}
                  </Modal>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
  /* Styling for dragged element */
  :global(#dnd-action-dragged-el).dnd-list-item {
      opacity: 90% !important;
  }
</style>