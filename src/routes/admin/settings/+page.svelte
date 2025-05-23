<!--
  @component The admin settings page (used for configuring settings).
-->
<script lang="ts">
    import LabeledSlideToggle from "$lib/components/LabeledSlideToggle.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import EditDelegateCard from "$lib/components/modals/EditDelegateCard.svelte";
    import { DEFAULT_PRESET_KEY, getPreset, PRESETS } from "$lib/delegate_presets";
    import { SORT_KIND_NAMES, SORT_PROPERTY_NAMES } from "$lib/motions/sort";
    import type { DelegateAttrs, Settings } from "$lib/types";
    import { downloadFile, triggerConfirmModal } from "$lib/util";

    import { FileButton, getModalStore } from "@skeletonlabs/skeleton";
    import EnableDelegatesCard from "$lib/components/modals/EnableDelegatesCard.svelte";
    import { _legacyFixDelFlag, db, queryStore } from "$lib/db/index.svelte";
    import { toKeyValueArray, toObject } from "$lib/db/keyval";
    import MdiArrowDown from "~icons/mdi/arrow-down";
    import MdiCancel from "~icons/mdi/cancel";
    import MdiCircleSmall from "~icons/mdi/circle-small";
    import MdiMerge from "~icons/mdi/merge";
    import MdiPencil from "~icons/mdi/pencil";

    const settings = queryStore(async () => toObject(await db.settings.toArray()) as Settings);

    let delegates = queryStore(() => db.delegates.orderBy("order").toArray(), []);
    let delsEnabledAll = $derived.by(() => {
        const [first, ...rest] = $delegates.map(del => del.enabled);
        return rest.every(k => k === first) ? first : undefined;
    });

    const PREFERENCES_LABELS = [
        { key: "enableMotionRoundRobin", label: "Enable round robin" },
        { key: "enableMotionExt", label: "Enable extensions" },
        { key: "pauseMainTimer", label: "Pause main timer when delegate timer elapses" },
        { key: "yieldMainTimer", label: "Return time yielded by delegates to main timer" },
    ] as const;
    const modalStore = getModalStore();
    let files: FileList | undefined = $state();

    // IMPORT & EXPORT
    async function importFile() {
        const file = files?.item(0);
        if (file) {
            const text = await file.text();
            const json = JSON.parse(text);

            // TODO: input validation
            let { settings: newSettings, delegates: newDelegates } = json;
            await db.transaction("rw", [db.sessionData, db.settings, db.delegates], async () => {
                await db.resetSettings();
                await db.settings.bulkUpdate(toKeyValueArray(newSettings).map(({ key, val }) => ({ key, changes: { val }})));

                await db.resetSessionData();
                await db.delegates.clear();
                await db.addDelegates(newDelegates);
            })
        }
    }
    function exportFile() {
        if (!$settings || !$delegates) return;
        let exportSettings = {
            settings: $settings,
            delegates: $delegates.map(d => d.getAttributes())
        };

        downloadFile("couchmun-config.json", JSON.stringify(exportSettings), "application/json");
    }
    function resetAllSettings() {
        triggerConfirmModal(modalStore,
            "Are you sure you want to reset all settings? This will also wipe all sessions.", 
            async () => {
                // Reset preset state cause it's not bound to settings
                currentPreset = DEFAULT_PRESET_KEY;
                // Reset settings
                await db.resetSettings();
                await setPreset();

                // Remove session data + previous sessions.
                await db.resetSessionData();
                await db.prevSessions.clear();
            }
        )
    }

    // SORT ORDER
    function mergeUnmergeOrder(entryIndex: number, kindIndex: number) {
        if (entryIndex == 0 && kindIndex == 0) return;
        db.settings.update("sortOrder", ({ val: $o }) => {
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
        });
    }
    // DELEGATES
    let currentPreset: keyof typeof PRESETS = $state(DEFAULT_PRESET_KEY);
    async function setPreset() {
        const preset = await getPreset(currentPreset);
        if (typeof preset !== "undefined") {
            let entries = await _legacyFixDelFlag(preset);
            await db.transaction("rw", db.delegates, async () => {
                await db.delegates.clear();
                await db.addDelegates(entries);
            });
        }
    }
    async function setAllEnableStatuses(enabled: boolean) {
        db.transaction("rw", db.delegates, async () => {
            await db.delegates.toCollection().modify({ enabled });
        })
    }
    function clearDelegates() {
        triggerConfirmModal(modalStore,
            "Are you sure you want to remove all delegates?", 
            async () => {
                currentPreset = "custom";
                await db.delegates.clear();
            }
        );
    }

    /**
     * Opens the delegate editing modal. This can also be used to add a new delegate.
     * @param id Key of delegate to edit (or undefined if adding a new delegate)
     */
    async function editDelegate(id: number | undefined) {
        let attrs = typeof id === "number" 
            ? (await db.delegates.get(id))?.getAttributes()
            : undefined;

        modalStore.trigger({
            type: "component",
            component: { ref: EditDelegateCard, props: { attrs } },
            response(data?: { attrs: DelegateAttrs }) {
                if (!data) return;

                let newAttrs = data.attrs;
                db.transaction("rw", db.delegates, async () => {
                    // TODO: reject update if name conflict
                    currentPreset = "custom";
                    if (typeof id === "number") {
                        await db.delegates.update(id, newAttrs);
                    } else {
                        await db.addDelegate(newAttrs);
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
{#if $settings && Object.keys($settings).length}
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
        <h3 class="h3 text-center">Preferences</h3>
        <div class="flex flex-col gap-3">
            {#each PREFERENCES_LABELS as { key, label }}
                <LabeledSlideToggle 
                    name="prefs-{key}"
                    bind:checked={
                        () => $settings.preferences[key],
                        pref => db.settings.update("preferences", (prefs) => { prefs.val[key] = pref; })
                    }
                >
                    <div>{label}</div>
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
                        {#each $settings.sortOrder as entry, ei}
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
                                            {#if ki == 0}
                                                <MdiMerge />
                                            {:else}
                                                <MdiCircleSmall />
                                            {/if}
                                        </button>
                                        {SORT_KIND_NAMES[k]}
                                    </div>
                                {/each}
                            </td>
                            <td>
                                <div class="flex gap-3 items-center">
                                    {#each entry.order as key, oi}
                                    <div class="card p-1 flex items-center bg-surface-300-600-token">
                                        <span>{SORT_PROPERTY_NAMES[key.property]}</span>
                                        <button onclick={() => {
                                            db.settings.update("sortOrder", ({ val: order }) => { order[ei].order[oi].ascending = !order[ei].order[oi].ascending })
                                        }}>
                                            <!-- TODO: add aria-label, title -->
                                            <MdiArrowDown
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
                        <th class="text-center"><input class="checkbox" type="checkbox" checked={delsEnabledAll} indeterminate={typeof delsEnabledAll === "undefined"} onclick={() => setAllEnableStatuses(!delsEnabledAll)}></th>
                        <th class="text-right">Configure</th>
                    </tr>
                </thead>
                <tbody>
                    {#each $delegates as attrs (attrs.id)}
                    <tr>
                        <td class="w-full"><DelLabel {attrs} inline fallbackFlag="icon" /></td>
                        <td class="text-center">
                            <input class="checkbox" type="checkbox" 
                                bind:checked={
                                    () => attrs.enabled,
                                    enabled => db.updateDelegate(attrs.id, { enabled })
                                }>
                        </td>
                        <td class="text-right">
                            <button
                                onclick={() => editDelegate(attrs.id)}
                                aria-label="Edit {attrs.name}"
                                title="Edit {attrs.name}"
                            >
                                <MdiPencil />
                            </button>
                            <button
                                onclick={() => deleteDelegate(attrs.id)}
                                aria-label="Delete {attrs.name}"
                                title="Delete {attrs.name}"
                            >
                                <MdiCancel class="text-error-500" />
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
{/if}

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