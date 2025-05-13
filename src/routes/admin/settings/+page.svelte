<!--
  @component The admin settings page (used for configuring settings).
-->
<script lang="ts">
    import LabeledSwitch from "$lib/components/LabeledSwitch.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import ConfirmModalCard from "$lib/components/modals/ConfirmModalCard.svelte";
    import EditDelegateCard from "$lib/components/modals/EditDelegateCard.svelte";
    import EnableDelegatesCard from "$lib/components/modals/EnableDelegatesCard.svelte";
    import { DEFAULT_PRESET_KEY, getPreset, PRESETS } from "$lib/delegate_presets";
    import { SORT_KIND_NAMES, SORT_PROPERTY_NAMES } from "$lib/motions/sort";
    import type { DelegateAttrs, Settings } from "$lib/types";
    import { downloadFile } from "$lib/util";

    import { FileUpload, Modal } from "@skeletonlabs/skeleton-svelte";
    import { _legacyFixDelFlag, db, queryStore } from "$lib/db/index.svelte";
    import { toKeyValueArray, toObject } from "$lib/db/keyval";
    import { defaultModalClasses } from "$lib/components/modals/ModalContent.svelte";
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
    
    let openModals = $state({
        resetAllSettings: false,
        clearDelegates: false,
        addDelegate: false,
        configureEnableDelegates: false,
        editDelegate: {} as Record<number, boolean>
    });

    // IMPORT & EXPORT
    async function importFile(files: File[]) {
        const [file] = files;
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
    async function resetAllSettings() {
        // Reset preset state cause it's not bound to settings
        currentPreset = DEFAULT_PRESET_KEY;
        // Reset settings
        await db.resetSettings();
        await setPreset();

        // Remove session data + previous sessions.
        await db.resetSessionData();
        await db.prevSessions.clear();
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

    async function clearDelegates() {
        currentPreset = "custom";
        await db.delegates.clear();
    }
    /**
     * Updates delegate with delegate modal data.
     * @param id Key of delegate to edit (or undefined if adding a new delegate)
     * @param data New data to add
     */
    async function editDelegate(id: number | undefined, data?: { attrs: DelegateAttrs }) {
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
    function configureEnableDelegates(data?: Set<number>) {
        if (!data) return;

        db.transaction("rw", db.delegates, async () => {
            await db.delegates.toCollection().modify((del) => {
                del.enabled = data.has(del.id);
            })
        });
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

<MetaTags title="Settings · CouchMUN (Admin)" />
{#if $settings && Object.keys($settings).length}
<div class="flex flex-col p-4 gap-4">
    <div class="panel">
        <h3 class="h3 text-center">Control Panel</h3>
        <div class="flex gap-3 justify-center">
            <FileUpload 
                name="import"
                accept="application/json"
                onFileAccept={e => importFile(e.files)}
            >
                <button class="btn preset-filled-primary-500">
                    Import from file...
                </button>
            </FileUpload>
            <button
                class="btn preset-filled-primary-500"
                onclick={exportFile}
            >
                Export to file...
            </button>
            <Modal
                open={openModals.resetAllSettings}
                onOpenChange={e => openModals.resetAllSettings = e.open}
                triggerBase="btn preset-filled-error-500"
                {...defaultModalClasses}
            >
                {#snippet trigger()}
                    Reset all settings
                {/snippet}
                {#snippet content()}
                    <ConfirmModalCard bind:open={openModals.resetAllSettings} success={resetAllSettings}>
                        Are you sure you want to reset all settings? This will also wipe all sessions.
                    </ConfirmModalCard>
                {/snippet}
            </Modal>
        </div>
    </div>
    <hr class="hr" />
    <div class="panel">
        <h3 class="h3 text-center">Preferences</h3>
        <div class="flex flex-col gap-3">
            {#each PREFERENCES_LABELS as { key, label }}
                <LabeledSwitch 
                    name="prefs-{key}"
                    bind:checked={
                        () => $settings.preferences[key],
                        pref => db.settings.update("preferences", (prefs) => { prefs.val[key] = pref; })
                    }
                >
                    <div>{label}</div>
                </LabeledSwitch>
            {/each}
        </div>
    </div>
    <hr class="hr" />
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
                                            class="btn-icon-std" 
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
                                    <div class="card-filled p-1 flex items-center">
                                        <span>{SORT_PROPERTY_NAMES[key.property]}</span>
                                        <button onclick={() => {
                                            db.settings.update("sortOrder", ({ val: order }) => { order[ei].order[oi].ascending = !order[ei].order[oi].ascending })
                                        }}>
                                            <!-- TODO: add aria-label, title -->
                                            <MdiArrowDown
                                                class={["transition-transform", key.ascending && "rotating-180"]}
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
    <hr class="hr" />
    <div class="panel">
        <!-- Delegate Main Settings -->
        <div class="card-filled p-4 flex flex-col gap-3">
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
                <Modal
                    open={openModals.addDelegate}
                    onOpenChange={e => openModals.addDelegate = e.open}
                    triggerBase="btn preset-filled-primary-500"
                    {...defaultModalClasses}
                >
                    {#snippet trigger()}
                        Add Delegate
                    {/snippet}
                    {#snippet content()}
                        <EditDelegateCard bind:open={openModals.addDelegate} onSubmit={d => editDelegate(undefined, d)} />
                    {/snippet}
                </Modal>
                <Modal
                    open={openModals.configureEnableDelegates}
                    onOpenChange={e => openModals.configureEnableDelegates = e.open}
                    triggerBase="btn preset-filled-primary-500"
                    {...defaultModalClasses}
                >
                    {#snippet trigger()}
                        Enable/Disable Delegates
                    {/snippet}
                    {#snippet content()}
                        <EnableDelegatesCard attrs={$delegates} bind:open={openModals.configureEnableDelegates} onSubmit={configureEnableDelegates} />
                    {/snippet}
                </Modal>
                <Modal 
                    open={openModals.clearDelegates}
                    onOpenChange={e => openModals.clearDelegates = e.open}
                    triggerBase="btn preset-filled-error-500"
                    {...defaultModalClasses}
                >
                    {#snippet trigger()}
                        Clear Delegates
                    {/snippet}
                    {#snippet content()}
                        <ConfirmModalCard bind:open={openModals.clearDelegates} success={clearDelegates}>
                            Are you sure you want to remove all delegates?
                        </ConfirmModalCard>
                    {/snippet}
                </Modal>
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
                            <Modal
                                open={openModals.editDelegate[attrs.id]}
                                onOpenChange={e => openModals.editDelegate[attrs.id] = e.open}
                                triggerBase=""
                                aria-label="Edit {attrs.name}"
                                {...defaultModalClasses}
                            >
                                {#snippet trigger()}
                                    <MdiPencil />
                                {/snippet}
                                {#snippet content()}
                                    {#await db.delegates.get(attrs.id) then del}
                                        <EditDelegateCard attrs={del?.getAttributes()} bind:open={openModals.addDelegate} onSubmit={d => editDelegate(attrs.id, d)} />
                                    {/await}
                                {/snippet}
                            </Modal>
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
    <hr class="hr" />
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