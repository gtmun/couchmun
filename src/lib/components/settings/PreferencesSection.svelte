<script lang="ts">
    import { Portal, Tooltip } from "@skeletonlabs/skeleton-svelte";

    import LabeledSwitch from "../controls/LabeledSwitch.svelte";

    import type { SessionDatabase } from "$lib/db/index.svelte";
    import type { Preferences } from "$lib/types";
    import MdiInformationOutline from "~icons/mdi/information-outline";

    interface Props {
        /**
         * Database, which contains settings. Used to set preferences.
        */
        db: SessionDatabase,
        /**
         * Current state of preferences, used to display states.
         */
        preferences: Preferences,
    }
    let { db, preferences }: Props = $props();

    type PrefItem = {
        type: "header", label: string
    } | {
        type: "setting", key: keyof Preferences, label: string, info?: string[]
    }
    const PREFERENCES_LABELS: PrefItem[] = [
        { type: "header", label: "Timers" },
        {
            type: "setting",
            key: "yieldMainTimer",
            label: "Return time when delegate yields",
            info: [
                `If enabled, unused speaking time (in a moderated caucus) is "returned" to the main timer, allowing it to be further used in the moderated caucus.`,
                "",
                "If disabled, unused speaking time is automatically deducted from the main timer.",
            ]
        },
        {
            type: "setting",
            key: "pauseMainTimer",
            label: "Pause when delegate timer elapses",
            info: [
                "If enabled, then time is automatically paused after the delegate's time elapses (in moderated caucuses).",
                "",
                "If disabled, then the main timer continues after the delegate's time elapses. Additionally, the delegate and main timers will have separate play/pause buttons."
            ]
        },

        { type: "header", label: "Show/Hide UI" },
        { type: "setting", key: "enableMotionRoundRobin", label: "Enable round robin" },
        { type: "setting", key: "enableMotionExt", label: "Enable extensions" },
    ];
</script>

<h3 class="h3 text-center" id="preferences">Preferences</h3>
<div class="flex flex-col gap-2">
    <!-- Preferences labels doesn't change, this doesn't need a key -->
    <!-- eslint-disable-next-line svelte/require-each-key -->
    {#each PREFERENCES_LABELS as item}
        {#if item.type === "header"}
            <hr class="hr my-2" />
            <div class="nav-header">
                {item.label}
            </div>
        {:else if item.type === "setting"}
            <LabeledSwitch 
                name="prefs-{item.key}"
                bind:checked={
                    () => preferences[item.key],
                    pref => db.settings.update("preferences", (prefs) => { prefs.val[item.key] = pref; })
                }
            >
                <div class="flex items-center gap-1">
                    {item.label}
                    {#if item.info && item.info.length}
                        <Tooltip openDelay={150}>
                            <Tooltip.Trigger>
                                <MdiInformationOutline class="text-sm text-surface-500" />
                            </Tooltip.Trigger>
                            <Portal>
                                <Tooltip.Positioner>
                                    <Tooltip.Content class="card bg-surface-100-900 p-4 shadow max-w-100">
                                        <span class="text-sm">
                                            <!-- eslint-disable-next-line svelte/require-each-key -->
                                            {#each item.info as line}
                                                {line}<br/>
                                            {/each}
                                        </span>
                                        <Tooltip.Arrow class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-100-900)]">
                                            <Tooltip.ArrowTip />
                                        </Tooltip.Arrow>
                                    </Tooltip.Content>
                                </Tooltip.Positioner>
                            </Portal>
                        </Tooltip>
                    {/if}
                </div>
            </LabeledSwitch>
        {/if}
    {/each}
</div>