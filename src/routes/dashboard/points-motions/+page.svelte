<!--
  @component The points & motions page (used for creating and viewing the current points & motions).

  This includes a MotionForm (which is used to add motions)
  and a sortable motion table (which is used to view and rearrange and edit motions).
-->
<script lang="ts">
  import { DragDropProvider } from "@dnd-kit/svelte";
  import { untrack } from "svelte";
  import { flip } from "svelte/animate";

  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import DelLabel from "$lib/components/del-label/DelLabel.svelte";
  import IconLabel from "$lib/components/IconLabel.svelte";
  import EditMotionContent from "$lib/components/modals/EditMotionContent.svelte";
  import UniModal from "$lib/components/modals/UniModal.svelte";
  import MotionForm from "$lib/components/motions/form/MotionForm.svelte";
  import OrientedCollapsible from "$lib/components/OrientedCollapsible.svelte";
  import { getSessionContext } from "$lib/context/index.svelte";
  import { findDelegate } from "$lib/db/delegates";
  import { db } from "$lib/db/index.svelte";
  import { compareMotions as motionComparator, createMotionSchema, MOTION_DEFS, type MotionDef, type DisplayFieldKey, type DisplayFieldHeader, DISPLAY_FIELD_HEADERS } from "$lib/motions/definitions";
  import type { Motion } from "$lib/types";
  import { a11yLabel, hasKey, NO_FIGURE } from "$lib/util";
  import { createSortable, handleDrag } from "$lib/util/dnd";
  import { proxify } from "$lib/util/sv.svelte";
  import MdiCancel from "~icons/mdi/cancel";
  import MdiCheck from "~icons/mdi/check";
  import MdiPencil from "~icons/mdi/pencil";
  import MdiSort from "~icons/mdi/sort";
  import MdiUndo from "~icons/mdi/undo";

  const { motions, selectedMotion, selectedMotionState, delegates, sortOrder } = getSessionContext();
  const pid = $props.id();

  let editMotionModal = $state({ open: false, index: -1 });
  // A clone of $motions used solely for use:dndzone
  let dndItems = $derived(proxify($motions));
  
  let motionSchema = $derived(createMotionSchema($delegates));
  let motionCmp = $derived(motionComparator($sortOrder, $delegates));
  
  function submitMotion(motion: Motion) {
    motions.update($m => {
      $m.push(motion);
      return $m;
    });
    db.updateDelegate(motion.delegate, d => { d.stats.motionsProposed++; });
  }

  /// Converts empty strings and nullish values to the provided fallback.
  function dataOrFallback<T>(data: T | undefined, fallback: T) {
    return data !== "" ? (data ?? fallback) : fallback;
  }
  function motionName(m: Motion) {
    const kindLabel = MOTION_DEFS[m.kind].label ?? NO_FIGURE;
    const extension = hasKey(m, "isExtension") && m.isExtension;
    
    return kindLabel + (extension ? ' (Extension)': '');
  }

  function motionDisplayEntries(m: Motion) {
    return (MOTION_DEFS[m.kind] as MotionDef).display(m, $delegates);
  }
  function motionHeader(m: DisplayFieldKey): DisplayFieldHeader {
    return DISPLAY_FIELD_HEADERS[m] as DisplayFieldHeader;
  }
  // Get all fields which are used by the current set of motiosn,
  // and order them by header order
  let fieldHeaders = $derived.by(() => {
    const keys = new Set(
      dndItems.map(m => motionDisplayEntries(m))
        .flatMap(e => Object.keys(e) as DisplayFieldKey[])
    );
    return (Object.keys(DISPLAY_FIELD_HEADERS) as DisplayFieldKey[])
      .filter(k => keys.has(k));
  });
  
  // MOTION BUTTONS
  function removeMotion(i: number) {
    let removing: Motion[] = [];
    motions.update($m => {
      removing.push(...$m.splice(i, 1));
      return $m;
    });

    deletedMotions.push(...removing);
  }

  async function acceptMotion(motion: Motion) {
    // Update selected motion and initialize selected motion state:
    $selectedMotion = motion;
    $selectedMotionState = { speakersList: [] };

    $motions = [];
    await db.updateDelegate(motion.delegate, d => { d.stats.motionsAccepted++; });
  }
  async function acceptMotionAndGoto(motion: Motion) {
    await acceptMotion(motion);
    goto(resolve("/dashboard/current-motion"));
  }
  function editMotion(i: number, motion?: Motion) {
    if (!motion) return;
    db.updateDelegate($motions[i].delegate, d => { d.stats.motionsProposed--; });
    db.updateDelegate(motion.delegate, d => { d.stats.motionsProposed++; });
    $motions[i] = motion;
  }

  function sortMotions() {
    $motions = $motions.sort(motionCmp);
  }
  // Check every window of two motions is in the right order:
  let motionsSorted = $derived.by(() => {
    try {
      return Array.from({ length: $motions.length - 1 }, (_, i) => motionCmp($motions[i], $motions[i + 1]) <= 0)
        .every(b => b);
    } catch {
      // If comparing crashes, don't allow the button to do anything
      return true;
    }
  });

  // Store any motions that were deleted
  // (so we can recover it if someone presses the undo button).
  let deletedMotions = $state<Motion[]>([]);
  function undo() {
    let el = $state.snapshot(deletedMotions.pop());
    if (el) {
      motions.update($m => {
        $m.unshift(el);
        return $m;
      });
    }
  }
</script>

<div class="flex flex-col gap-3 min-h-full md:h-full md:flex-row @container">
  <div class="flex card-filled">
    <OrientedCollapsible>
      <div class="w-full md:w-[30cqw] *:pb-0 *:md:pb-3 *:md:pr-0">
        <MotionForm submit={submitMotion} {motionSchema} />
      </div>
    </OrientedCollapsible>
  </div>
  
  <div class="flex flex-col gap-2 overflow-x-auto md:min-w-[60cqw] grow">
    <div class="grid grid-cols-[auto_1fr_auto] items-center">
      <button
        class="btn-icon-std transition-colors preset-filled-primary-500"
        onclick={undo}
        {...a11yLabel("Undo Deleted Motion")}
        disabled={deletedMotions.length == 0}
      >
        <MdiUndo />
      </button>
      <h3 class="h3 text-center" id="motion-table-header-{pid}">List of Motions</h3>
      <button
        class={["btn-icon-std transition-colors", motionsSorted ? "preset-ui-depressed" : "preset-ui-activated"]}
        onclick={sortMotions}
        {...a11yLabel("Sort Motions")}
        disabled={motionsSorted}
      >
        <MdiSort />
      </button>
    </div>
    
    <DragDropProvider
      onDragOver={handleDrag(dndItems)}
      onDragEnd={() => $motions = dndItems}
      --cm-gap-x={2}
      --cm-motion-colsize={28}
      --cm-delegate-colsize={36}
      --cm-field-min-colsize={20}
      --cm-controls-colsize={24}
      --cm-field-colsizes={
        fieldHeaders.length
        ? `repeat(${fieldHeaders.length}, minmax(calc(var(--spacing) * var(--cm-field-min-colsize)), 1fr)) 1px`
        : "1fr"
      }
      --cm-all-cols={2 + 1 + fieldHeaders.length + 1 + 1}
    >
      <div class={[
        "grid cm-table-colsizes",
        "rounded border border-surface-200-800 w-full overflow-auto"
      ]}>
        <!-- Headers -->
        <div class={[
            "grid grid-cols-subgrid col-span-(--cm-all-cols)",
            "p-2 items-center border-b",
            "border-surface-200-800 bg-surface-100-900"
          ]}>
          <div>Motion</div>
          <div>By</div>
          <div class="border-r border-surface-200-800 self-stretch"></div>
          {#each fieldHeaders as k (k)}
            {const field = motionHeader(k)}
            <div class={["flex", field.right && "justify-end text-right"]}>
              {#if field.icon}
                <IconLabel icon={field.icon} label={field.header} />
              {:else}
                <div>{field.header}</div>
              {/if}
            </div>
          {/each}
          <div class="border-r border-surface-200-800 self-stretch"></div>
          <div></div>
        </div>
        <!-- Data -->
        <ul class="contents">
          {#each dndItems as motion, i (motion.id)}
            {@const delAttrs = findDelegate($delegates, motion.delegate)}
            {@const delName = delAttrs?.name ?? "unknown"}
            {@const motName = motionName(motion)}
            {@const motEntries = motionDisplayEntries(motion)}
            {@const sortable = untrack(() => createSortable({
              get id() { return motion.id; }, get index() { return i; }
            }))}
            <li
              class={[
                "grid grid-cols-subgrid col-span-(--cm-all-cols)",
                "p-2 items-center",
                "preset-tonal-surface hover:preset-tonal-primary not-last:border-b border-surface-200-800",
                "data-dnd-dragging:preset-tonal-primary data-dnd-dragging:rounded cm-table-colsizes-drag",
                "data-dnd-placeholder:*:invisible data-dnd-placeholder:bg-surface-200-800",
              ]}
              {@attach sortable.attach}
              animate:flip={{ duration: 150 }}
              ondblclick={() => editMotionModal = { open: true, index: i }}
              {...a11yLabel(`${delName}'s ${motName}`)}
              // Needed because {sortable.attach} overrides role
              role="listitem"
            >
              <!-- Delegate & motion display -->
              <div aria-label="Motion {motName}">{motName}</div>
              <div aria-label="By {delName}">
                <DelLabel attrs={delAttrs} fallbackName={delName} inline />
              </div>
              <!-- Vertical rule -->
              <div class="self-stretch border-r border-surface-200-800"></div>
              {#each fieldHeaders as k (k)}
                {const field = motionHeader(k)}
                {@const value = motEntries[k]}
                {@const dataNf = dataOrFallback(value, NO_FIGURE)}
                {@const dataNone = dataOrFallback(value, "none")}
                <div
                  class={["tabular-nums wrap-break-word break-all", field.right && "text-right"]}
                  aria-label="{field.header} {dataNone}"
                >
                  {dataNf}
                </div>
              {/each}
              <!-- Vertical rule -->
              <div class="self-stretch border-r border-surface-200-800"></div>
              <!-- Control buttons -->
              <div class="flex justify-center items-center gap-1">
                <button
                  class="btn-icon-std p-1 preset-tonal-error"
                  onclick={() => removeMotion(i)}
                  {...a11yLabel(`Reject ${delName}'s Motion`)}
                >
                  <MdiCancel />
                </button>
                <button
                  class="btn-icon-std p-1 preset-tonal-success"
                  onclick={() => acceptMotionAndGoto(motion)}
                  {...a11yLabel(`Accept ${delName}'s Motion`)}
                >
                  <MdiCheck />
                </button>
                <button
                  class="btn-icon-std p-1 preset-tonal"
                  onclick={() => editMotionModal = { open: true, index: i }}
                  {...a11yLabel(`Edit ${delName}'s Motion`)}
                >
                  <MdiPencil />
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    </DragDropProvider>
  </div>
</div>
<UniModal
  bind:open={editMotionModal.open}
  onSubmit={(m: Motion) => editMotion(editMotionModal.index, m)}
>
  {#snippet content(exitState)}
    <EditMotionContent motion={$motions[editMotionModal.index]} {motionSchema} {exitState} />
  {/snippet}
</UniModal>

<style>
  /* The size of columns in the table */
  .cm-table-colsizes, .cm-table-colsizes-drag[data-dnd-dragging] {
    column-gap: calc(var(--spacing) * var(--cm-gap-x));
    grid-template-columns:
      calc(var(--spacing) * var(--cm-motion-colsize))
      calc(var(--spacing) * var(--cm-delegate-colsize))
      1px
      var(--cm-field-colsizes)
      calc(var(--spacing) * var(--cm-controls-colsize));
  }
</style>