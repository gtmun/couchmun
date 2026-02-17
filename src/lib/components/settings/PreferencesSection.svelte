<script lang="ts">
    import LabeledSwitch from "../controls/LabeledSwitch.svelte";

    import type { SessionDatabase } from "$lib/db/index.svelte";
    import type { Preferences } from "$lib/types";

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

    const PREFERENCES_LABELS = [
        { key: "enableMotionRoundRobin", label: "Enable round robin" },
        { key: "enableMotionExt", label: "Enable extensions" },
        { key: "pauseMainTimer", label: "Pause main timer when delegate timer elapses" },
        { key: "yieldMainTimer", label: "Return time yielded by delegates to main timer" },
    ] as const;
</script>

<h3 class="h3 text-center" id="preferences">Preferences</h3>
<div class="flex flex-col gap-3">
    {#each PREFERENCES_LABELS as { key, label } (key)}
        <LabeledSwitch 
            name="prefs-{key}"
            bind:checked={
                () => preferences[key],
                pref => db.settings.update("preferences", (prefs) => { prefs.val[key] = pref; })
            }
        >
            <div>{label}</div>
        </LabeledSwitch>
    {/each}
</div>