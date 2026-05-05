<script lang="ts">
    import LabeledSwitch from "$lib/components/controls/LabeledSwitch.svelte";
    import type { SessionDatabase } from "$lib/db/index.svelte";
    import { getSortLabel, MOTION_DEFS, MOTION_GROUP_LABELS } from "$lib/motions/definitions";
    import { SORT_KIND_EXTRAS_NAMES } from "$lib/motions/sort";
    import type { SortKind } from "$lib/types";

    interface Props {
        /**
         * Database, which contains settings. Used to set preferences.
        */
        db: SessionDatabase,
        /**
         * Current state of preferences, used to display states.
         */
        enabledMotions: Partial<Record<SortKind, boolean>>,
    }
    let { db, enabledMotions }: Props = $props();

    let allKeys = [...Object.keys(SORT_KIND_EXTRAS_NAMES), ...Object.keys(MOTION_DEFS)] as SortKind[];

    type GroupLabel = keyof typeof MOTION_GROUP_LABELS;
    function getGroup(k: SortKind): GroupLabel | undefined {
        return (MOTION_DEFS as Record<string, { group?: GroupLabel } | undefined>)[k]?.group;
    }
    let motionGroups: Map<GroupLabel | undefined, { key: SortKind }[]> = $derived.by(() => {
        let motions = allKeys.map(key => ({ key, group: getGroup(key) }));
        return Map.groupBy(motions, ({ group }) => group);
    });
</script>

<h3 class="h3 text-center" id="motions">Motions</h3>
<div class="flex flex-col gap-3">
    <div class="text-center italic">
        Configure which motions are available in session.
    </div>
    {#each motionGroups as [g, keys] (g)}
        <div>
            <div class="nav-header">{g ? MOTION_GROUP_LABELS[g] : "Debate"}</div>
            {#each keys as { key } (key)}
                <div class="rounded hover:bg-surface-100-900 py-1">
                    <LabeledSwitch
                        name="motion-enabled-{key}"
                        bind:checked={
                            () => enabledMotions[key] ?? true,
                            s => db.settings.update("enabledMotions", em => {em.val[key] = s})
                        }
                    >
                        {getSortLabel(key)}
                    </LabeledSwitch>
                </div>
            {/each}
        </div>
    {/each}
</div>