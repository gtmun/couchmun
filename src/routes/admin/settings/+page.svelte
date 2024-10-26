<script lang="ts">
    import LabeledSlideToggle from "$lib/components/LabeledSlideToggle.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import EditDelegateCard from "$lib/components/modals/EditDelegateCard.svelte";
    import { defaultPresetKey, getPreset, PRESETS } from "$lib/delegate_presets";
    import { SORT_KIND_NAMES, SORT_PROPERTY_NAMES } from "$lib/motions/sort";
    import { getSettingsContext, resetSettingsContext } from "$lib/stores/settings";
    import type { DelegateAttrs, Preferences } from "$lib/types";
    import { compare, downloadFile, triggerConfirmModal } from "$lib/util";

    import { get, type Writable } from "svelte/store";
    import Icon from "@iconify/svelte";
    import { FileButton, getModalStore } from "@skeletonlabs/skeleton";
    import EnableDelegatesCard from "$lib/components/modals/EnableDelegatesCard.svelte";

    const settings = getSettingsContext();
    const { delegateAttributes, sortOrder, delegatesEnabled, preferences } = settings;
    let delsEnabledAll: boolean | undefined = $derived.by(() => {
        const [first, ...rest] = Object.keys($delegateAttributes).map(key => $delegatesEnabled[key]);
        return rest.every(k => k === first) ? first : undefined;
    });

    const PREFERENCES_LABELS = {
        enableMotionRoundRobin: { label: "Enable round robin" },
        enableMotionExt: { label: "Enable extensions" },
        pauseMainTimer: { label: "Pause main timer when delegate timer elapses" },
    } satisfies Record<keyof Preferences, unknown>;
    const _preferences: Writable<Record<string, boolean>> = preferences;
    const modalStore = getModalStore();
    let files: FileList | undefined = $state();

    // IMPORT & EXPORT
    async function importFile() {
        const file = files?.item(0);
        if (file) {
            const text = await file.text();
            const json = JSON.parse(text);
            for (let [key, store] of Object.entries<Writable<unknown>>(settings)) {
                if (key in json) store.set(json[key]);
            }
        }
    }
    function exportFile() {
        const exportSettings = Object.fromEntries(Object.entries(settings).map(
            ([k, v]) => [k, "subscribe" in v ? get<unknown>(v) : v]
        ));

        downloadFile("couchmun-config.json", JSON.stringify(exportSettings), "application/json");
    }
    function resetAllSettings() {
        triggerConfirmModal(modalStore,
            "Are you sure you want to reset all settings?", 
            () => {
                // Reset preset state cause it's not bound to settings
                currentPreset = defaultPresetKey();
                // Reset settings
                resetSettingsContext(settings);
            }
        )
    }

    // DELEGATES
    let currentPreset: keyof typeof PRESETS = $state(defaultPresetKey());
    async function setPreset() {
        const preset = await getPreset(currentPreset);
        if (typeof preset !== "undefined") {
            delegateAttributes.set(preset);
            setAllEnableStatuses(true);
        }
    }
    function setAllEnableStatuses(status: boolean) {
        delegatesEnabled.update($enables => {
            for (let key of Object.keys($enables)) {
                $enables[key] = status;
            }
            return $enables;
        })
    }
    function clearDelegates() {
        triggerConfirmModal(modalStore,
            "Are you sure you want to remove all delegates?", 
            () => {
                delegateAttributes.set({});
                delegatesEnabled.set({});
                currentPreset = "custom";
            }
        );
    }

    /**
     * Opens the delegate editing modal. This can also be used to add a new delegate.
     * @param key Key of delegate to edit (or undefined if adding a new delegate)
     */
    function editDelegate(key: string | undefined) {
        modalStore.trigger({
            type: "component",
            component: {
                ref: EditDelegateCard,
                props: key ? { key, attrs: structuredClone($delegateAttributes[key]) } : {}
            },
            response(data?: { key: string, attrs: DelegateAttrs }) {
                if (!data) return;

                let { key: newKey, attrs: newAttrs } = data;
                delegateAttributes.update($attrs => {
                    let update = false;

                    if (typeof key === "undefined") {
                        update = true;
                    } else if (key !== newKey) {
                        if (!(newKey in $attrs)) {
                            // If key changed to a different key (which doesn't already exist),
                            // delete the old key
                            delete $attrs[key];
                            $delegatesEnabled[newKey] = $delegatesEnabled[key];
                            update = true;
                        } else {
                            // If key changed to key that already exists, don't do anything
                            update = false;
                        }

                    } else {
                        update = true;
                    }
                    
                    if (update) {
                        currentPreset = "custom";
                        $attrs[newKey] = newAttrs;
                        $delegatesEnabled[newKey] ??= true;
                        $attrs = Object.fromEntries(
                            Object.entries($attrs)
                                .sort(([_k1, a1], [_k2, a2]) => compare(a1.name, a2.name))
                        );
                    }
                    return $attrs;
                });
            }
        });
    }
    function configureEnableDelegates() {
        modalStore.trigger({
            type: "component",
            component: {
                ref: EnableDelegatesCard,
                props: { attrs: $delegateAttributes }
            },
            response(data?: Record<string, boolean>) {
                if (!data) return;

                $delegatesEnabled = Object.fromEntries(
                    Object.keys($delegateAttributes).map(k => [k, data[k] ?? false])
                );
            }
        })
    }
    function deleteDelegate(key: string) {
        currentPreset = "custom";
        delegateAttributes.update($attrs => {
            delete $attrs[key];
            return $attrs;
        })
    }
</script>

<MetaTags title="Settings &middot; CouchMUN (Admin)" />
<div class="flex flex-col p-4 gap-4">
    <div class="panel">
        <h3 class="h3 text-center">Control Panel</h3>
        <div class="flex gap-3 justify-center">
            <FileButton 
                name="import" 
                button="btn variant-filled-primary" 
                bind:files 
                on:change={importFile} 
                accept="application/json"
            >
                Import from file...
            </FileButton>
            <button
                class="btn variant-filled-primary"
                onclick={exportFile}
            >
                Export to file...
            </button>
            <button
                class="btn variant-filled-error"
                onclick={resetAllSettings}
            >
                Reset all settings
            </button>
        </div>
    </div>
    <hr />
    <div class="panel">
        <h3 class="h3 text-center">Preferences (WIP)</h3>
        <div class="flex flex-col gap-3">
            {#each Object.entries(PREFERENCES_LABELS) as [key, properties]}
                <LabeledSlideToggle name="prefs-{key}" bind:checked={$_preferences[key]} disabled={true}>
                    <div>{properties.label}</div>
                </LabeledSlideToggle>
            {/each}
        </div>
    </div>
    <hr />
    <div class="panel">
        <h3 class="h3 text-center">Sort Order (WIP)</h3>
        <div class="flex gap-3">
            <!-- Sort Order Table -->
            <div class="table-container">
                <table class="table table-compact del-table">
                    <thead>
                        <tr>
                            <th>Motion</th>
                            <th>Tiebreakers</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each $sortOrder as entry}
                            {#each entry.kind as k}
                                <tr>
                                    <td>{SORT_KIND_NAMES[k]}</td>
                                    <td class="flex gap-3">
                                        {#each entry.order as key}
                                            <div class="card p-1 flex items-center bg-surface-300-600-token">
                                                <span>{SORT_PROPERTY_NAMES[key.property]}</span>
                                                <button onclick={() => key.ascending = !key.ascending}>
                                                    <!-- TODO: add aria-label, title -->
                                                    <Icon
                                                        icon="mdi:arrow-down"
                                                        class="{key.ascending ? 'rotate-180' : ''} transition-[transform]"
                                                        width="1.2em"
                                                        height="1.2em"
                                                    />
                                                </button>
                                            </div>
                                        {/each}
                                    </td>
                                </tr>
                            {/each}
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <hr />
    <div class="panel">
        <!-- Delegate Main Settings -->
        <div class="card p-4 flex flex-col gap-3">
            <h3 class="h3 text-center">Delegates</h3>
            <label class="flex gap-3 justify-center items-center">
                <span>Apply Preset</span>
                <select class="select w-1/2" bind:value={currentPreset} onchange={setPreset}>
                    {#each Object.entries(PRESETS) as [value, preset]}
                    <option {value} label={preset.label}></option>
                    {/each}
                </select>
            </label>
            <div class="flex gap-3 justify-center">
                <button class="btn variant-filled-primary" onclick={() => editDelegate(undefined)}>Add Delegate</button>
                <button class="btn variant-filled-primary" onclick={() => configureEnableDelegates()}>Enable/Disable Delegates</button>
                <button class="btn variant-filled-error" onclick={clearDelegates}>Clear Delegates</button>
            </div>
        </div>
        <!-- Delegate Table -->
        <div class="table-container">
            <table class="table table-compact del-table">
                <thead>
                    <tr>
                        <th>Key</th>
                        <th>Name</th>
                        <th class="text-center"><input class="checkbox" type="checkbox" checked={delsEnabledAll} indeterminate={typeof delsEnabledAll === "undefined"} onclick={() => setAllEnableStatuses(!delsEnabledAll)}></th>
                        <th class="text-right">Configure</th>
                    </tr>
                </thead>
                <tbody>
                    {#each Object.entries($delegateAttributes) as [key, attrs] (key)}
                    <tr>
                        <td>
                            <code>{key}</code>
                        </td>
                        <td class="w-full"><DelLabel {key} {attrs} inline fallback="icon" /></td>
                        <td class="text-center">
                            <input class="checkbox" type="checkbox" bind:checked={$delegatesEnabled[key]}>
                        </td>
                        <td class="text-right">
                            <button
                                onclick={() => editDelegate(key)}
                                aria-label="Edit {attrs.name}"
                                title="Edit {attrs.name}"
                            >
                                <Icon icon="mdi:pencil" width="24" height="24" />
                            </button>
                            <button
                                onclick={() => deleteDelegate(key)}
                                aria-label="Delete {attrs.name}"
                                title="Delete {attrs.name}"
                            >
                                <Icon icon="mdi:cancel" width="24" height="24" class="text-error-500" />
                            </button>
                        </td>
                    </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
    <hr />
</div>

<style>
    .panel {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        width: 75%;
        align-self: center;
    }
    .del-table td {
        vertical-align: middle;
    }
</style>