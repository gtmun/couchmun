<script lang="ts">
    import LabeledSlideToggle from "$lib/components/LabeledSlideToggle.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import EditDelegateCard from "$lib/components/modals/EditDelegateCard.svelte";
    import { DEFAULT_PRESET_KEY, getPreset, PRESETS } from "$lib/delegate_presets";
    import { SORT_KIND_NAMES, SORT_PROPERTY_NAMES } from "$lib/motions/sort";
    import { getSettingsContext, resetSettingsContext } from "$lib/stores/settings";
    import type { DelegateAttrs, Preferences } from "$lib/types";
    import { downloadFile, triggerConfirmModal, wrapQuery } from "$lib/util";

    import { derived, get, type Writable } from "svelte/store";
    import Icon from "@iconify/svelte";
    import { FileButton, getModalStore } from "@skeletonlabs/skeleton";
    import EnableDelegatesCard from "$lib/components/modals/EnableDelegatesCard.svelte";
    import { addDelPresetData, db, populateSessionData } from "$lib/db";
    import { liveQuery } from "dexie";

    const settings = getSettingsContext();
    const { sortOrder, preferences } = settings;

    let delegates = wrapQuery(liveQuery(() => db.delegates.orderBy("order").toArray()));
    let delsEnabledAll = derived(delegates, $d => {
        const [first, ...rest] = ($d ?? []).map(del => del.enabled);
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
                currentPreset = DEFAULT_PRESET_KEY;
                // Reset settings
                resetSettingsContext(settings);
            }
        )
    }

    // SORT ORDER
    function mergeUnmergeOrder(entryIndex: number, kindIndex: number) {
        if (entryIndex == 0 && kindIndex == 0) return;
        sortOrder.update($o => {
            if (kindIndex == 0) {
                // Merge
                let [entry] = $o.splice(entryIndex, 1);
                if (entry) {
                    $o[entryIndex - 1].kind.push(...entry.kind);
                    // TODO: merge order
                }
            } else {
                // Unmerge
                let origKinds = $o[entryIndex].kind;
                let newKinds = origKinds.splice(kindIndex, origKinds.length - kindIndex);
                if (newKinds.length > 0) {
                    $o.splice(entryIndex + 1, 0, {
                        kind: newKinds,
                        order: $state.snapshot($o[entryIndex].order)
                    });
                }
            }

            return $o;
        });
    }
    // DELEGATES
    let currentPreset: keyof typeof PRESETS = $state(DEFAULT_PRESET_KEY);
    async function setPreset() {
        const preset = await getPreset(currentPreset);
        if (typeof preset !== "undefined") {
            await db.transaction("rw", db.delegates, async () => {
                db.delegates.clear();
                addDelPresetData(db.delegates, preset);
            });
        }
    }
    async function setEnableStatus(id: number, status: boolean) {
        db.transaction("rw", db.delegates, async () => {
            await db.delegates.update(id, { enabled: status });
        })
    }
    async function setAllEnableStatuses(status: boolean) {
        db.transaction("rw", db.delegates, async () => {
            await db.delegates.toCollection().modify({ enabled: status });
        })
    }
    function clearDelegates() {
        triggerConfirmModal(modalStore,
            "Are you sure you want to remove all delegates?", 
            async () => {
                currentPreset = "custom";
                await db.transaction("rw", db.delegates, async () => {
                    await db.delegates.clear();
                });
            }
        );
    }

    /**
     * Opens the delegate editing modal. This can also be used to add a new delegate.
     * @param id Key of delegate to edit (or undefined if adding a new delegate)
     */
    async function editDelegate(id: number | undefined) {
        let props = $state(typeof id === "number" ? { attrs: await db.delegates.get(id) } : {});

        modalStore.trigger({
            type: "component",
            component: { ref: EditDelegateCard, props },
            response(data?: { attrs: DelegateAttrs }) {
                if (!data) return;

                let newAttrs = $state.snapshot(data.attrs);
                db.transaction("rw", db.delegates, async () => {
                    // TODO: reject update if name conflict
                    currentPreset = "custom";
                    if (typeof id === "number") {
                        await db.delegates.update(id, newAttrs);
                    } else {
                        let order = await db.delegates.count();
                        let del = await populateSessionData(newAttrs, "un", order);
                        await db.delegates.add(del);
                    }
                });
            }
        });
    }
    function configureEnableDelegates() {
        modalStore.trigger({
            type: "component",
            component: {
                ref: EnableDelegatesCard,
                props: { attrs: $delegates }
            },
            response(data?: Set<number>) {
                if (!data) return;

                db.transaction("rw", db.delegates, async () => {
                    await db.delegates.toCollection().modify((del) => {
                        del.enabled = data.has(del.id);
                    })
                });
            }
        })
    }

    async function deleteDelegate(id: number) {
        currentPreset = "custom";
        await db.transaction("rw", db.delegates, async () => {
            let del = await db.delegates.get(id);
            await db.delegates.delete(id);

            // Decrement all orders above this one:
            if (typeof del?.order !== "undefined") {
                db.delegates.where("order")
                    .aboveOrEqual(del.order)
                    .modify(d => { d.order--; });
            }
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
                        {#each $sortOrder as entry, ei}
                        <tr>
                            <td>
                                {#each entry.kind as k, ki}
                                    <div class="flex items-center">
                                        <button 
                                            class="btn btn-icon" 
                                            onclick={() => mergeUnmergeOrder(ei, ki)} 
                                            disabled={ei == 0 && ki == 0}
                                            aria-label="Merge With Above Cell"
                                            title="Merge With Above Cell"
                                        >
                                            <Icon icon={ki == 0 ? "mdi:merge" : "mdi:circle-small"} width="24" height="24" />
                                        </button>
                                        {SORT_KIND_NAMES[k]}
                                    </div>
                                {/each}
                            </td>
                            <td>
                                <div class="flex gap-3 items-center">
                                    {#each entry.order as key}
                                    <div class="card p-1 flex items-center bg-surface-300-600-token">
                                        <span>{SORT_PROPERTY_NAMES[key.property]}</span>
                                        <button onclick={() => {key.ascending = !key.ascending; $sortOrder = $sortOrder}}>
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
                                </div>
                            </td>
                        </tr>
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
                        <th>Name</th>
                        <th class="text-center"><input class="checkbox" type="checkbox" checked={$delsEnabledAll} indeterminate={typeof $delsEnabledAll === "undefined"} onclick={() => setAllEnableStatuses(!$delsEnabledAll)}></th>
                        <th class="text-right">Configure</th>
                    </tr>
                </thead>
                <tbody>
                    {#each ($delegates ?? []) as attrs (attrs.id)}
                    <!-- TODO: Remove this key const -->
                    {@const key = String(attrs.id)}
                    <tr>
                        <td class="w-full"><DelLabel {key} {attrs} inline fallback="icon" /></td>
                        <td class="text-center">
                            <input class="checkbox" type="checkbox" checked={attrs.enabled} onclick={() => setEnableStatus(attrs.id, !attrs.enabled)}>
                        </td>
                        <td class="text-right">
                            <button
                                onclick={() => editDelegate(attrs.id)}
                                aria-label="Edit {attrs.name}"
                                title="Edit {attrs.name}"
                            >
                                <Icon icon="mdi:pencil" width="24" height="24" />
                            </button>
                            <button
                                onclick={() => deleteDelegate(attrs.id)}
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