<!--
  @component The admin settings page (used for configuring settings).
-->
<script lang="ts">
    import { FileUpload, Dialog, Navigation } from "@skeletonlabs/skeleton-svelte";

    import LabeledSwitch from "$lib/components/controls/LabeledSwitch.svelte";
    import DelLabel from "$lib/components/del-label/DelLabel.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import ConfirmModal from "$lib/components/modals/ConfirmModal.svelte";
    import EditDelegateContent from "$lib/components/modals/EditDelegateContent.svelte";
    import EnableDelegatesContent from "$lib/components/modals/EnableDelegatesContent.svelte";
    import UniModal from "$lib/components/modals/UniModal.svelte";
    import { _legacyFixDelFlag, db, queryStore } from "$lib/db/index.svelte";
    import { toKeyValueArray, toObject } from "$lib/db/keyval";
    import { DEFAULT_PRESET_KEY, getPreset, PRESETS } from "$lib/delegate_presets";
    import { SORT_KIND_NAMES, SORT_PROPERTY_NAMES } from "$lib/motions/sort";
    import type { DelegateAttrs, DelegateID, Settings } from "$lib/types";
    import { a11yLabel, downloadFile } from "$lib/util";
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
        configureEnableDelegates: false,
        editDelegate: {
            state: false,
            id: undefined,
            attrs: emptyAttrs(),
        } as { state: boolean, id?: DelegateID, attrs: DelegateAttrs }
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
            // HACK: Allows enabled to exist
            delegates: $delegates.map(d => Object.assign(d.getAttributes(), { enabled: d.enabled }))
        };

        downloadFile("couchmun-config.json", JSON.stringify(exportSettings), "application/json");
    }
    async function resetAllSettings() {
        // Reset settings
        await db.resetSettings();
        await setPreset(DEFAULT_PRESET_KEY);

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
    let inputPreset = $state("");
    async function setPreset(presetKey?: keyof typeof PRESETS) {
        presetKey ??= inputPreset as keyof typeof PRESETS;
        inputPreset = "";
        
        const preset = await getPreset(presetKey);
        if (typeof preset !== "undefined") {
            let entries = _legacyFixDelFlag(preset);
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
        await db.delegates.clear();
    }
    function emptyAttrs(): DelegateAttrs {
        return { name: "", aliases: [] }
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

    // Headers for navigation:
    let mainContent = $state<HTMLElement>();
    function getHeaders(): [string, string][] {
        return Array.from(
            mainContent?.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]") ?? [],
            e => [e.id, e.textContent!]
        );
    }
</script>

<MetaTags title="Settings · CouchMUN (Admin)" />
{#if $settings && Object.keys($settings).length}
<div class="w-full h-full grid grid-cols-1 md:grid-cols-[auto_1fr] items-stretch overflow-auto">
    <!-- --- -->
    <Navigation layout="sidebar" class="hidden md:grid grid-rows-[auto_1fr_auto] gap-4">
        <Navigation.Content>
            <Navigation.Group>
                <Navigation.Label class="capitalize pl-2">Settings</Navigation.Label>
                <Navigation.Menu>
                {#each getHeaders() as [id, label] (id)}
                    <Navigation.TriggerAnchor href="#{id}" title={label} aria-label={label}>
                        <Navigation.TriggerText>{label}</Navigation.TriggerText>
                    </Navigation.TriggerAnchor>
                {/each}
            </Navigation.Menu>
                </Navigation.Group>
        </Navigation.Content>
    </Navigation>
    <!-- --- -->
    <main class="flex flex-col gap-4 m-4 overflow-scroll" bind:this={mainContent}>
        <div class="panel">
            <h3 class="h3 text-center" id="control-panel">Control Panel</h3>
            <div class="flex gap-3 justify-center">
                <FileUpload
                    name="import"
                    accept="application/json"
                    onFileAccept={e => importFile(e.files)}
                    class="w-fit"
                >
                    <FileUpload.Trigger class="btn preset-filled-primary-500">
                        Import from file...
                    </FileUpload.Trigger>
                    <FileUpload.HiddenInput />
                </FileUpload>
                <button
                    class="btn preset-filled-primary-500"
                    onclick={exportFile}
                >
                    Export to file...
                </button>
                <ConfirmModal
                    bind:open={openModals.resetAllSettings}
                    success={resetAllSettings}
                >
                    {#snippet trigger()}
                        <Dialog.Trigger class="btn preset-filled-error-500">
                            Reset all settings
                        </Dialog.Trigger>
                    {/snippet}
                    {#snippet content()}
                        Are you sure you want to reset all settings? This will also wipe all sessions.
                    {/snippet}
                </ConfirmModal>
            </div>
        </div>
        <hr class="hr" />
        <div class="panel">
            <h3 class="h3 text-center" id="preferences">Preferences</h3>
            <div class="flex flex-col gap-3">
                {#each PREFERENCES_LABELS as { key, label } (key)}
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
            <h3 class="h3 text-center" id="motions">Motions (WIP)</h3>
        </div>
        <hr class="hr" />
        <div class="panel">
            <h3 class="h3 text-center" id="sort-order">Sort Order (WIP)</h3>
            <div class="flex gap-3">
                <!-- Sort Order Table -->
                <div class="table-wrap rounded border border-surface-200-800">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Motion</th>
                                <th>Tiebreakers</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- No key exists -->
                            <!-- eslint-disable-next-line svelte/require-each-key -->
                            {#each $settings.sortOrder as entry, ei}
                            <tr>
                                <td>
                                    <!-- No key exists -->
                                    <!-- eslint-disable-next-line svelte/require-each-key -->
                                    {#each entry.kind as k, ki}
                                        <div class="flex items-center">
                                            <button 
                                                class="btn-icon-std" 
                                                onclick={() => mergeUnmergeOrder(ei, ki)} 
                                                disabled={ei == 0 && ki == 0}
                                                {...a11yLabel("Merge With Above Cell")}
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
                                        <!-- No key exists -->
                                        <!-- eslint-disable-next-line svelte/require-each-key -->
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
                <h3 class="h3 text-center" id="delegates">Delegates</h3>
                <label class="flex gap-3 justify-center items-center">
                    <span>Apply Preset</span>
                    <select class="select w-1/2" bind:value={inputPreset} onchange={() => setPreset()}>
                        <option disabled selected value>-- Select preset --</option>
                        {#each Object.entries(PRESETS) as [value, preset] (value)}
                            <option {value} label={preset.label}></option>
                        {/each}
                    </select>
                </label>
                <div class="flex gap-3 justify-center">
                    <button
                        class="btn preset-filled-primary-500"
                        onclick={() => openModals.editDelegate = { state: true, attrs: emptyAttrs() }}
                    >
                        Add Delegate
                    </button>
                    <UniModal
                        bind:open={openModals.configureEnableDelegates}
                        onSubmit={configureEnableDelegates}
                    >
                        {#snippet trigger()}
                            <Dialog.Trigger class="btn preset-filled-primary-500">
                                Enable/Disable Delegates
                            </Dialog.Trigger>
                        {/snippet}
                        {#snippet content(exitState)}
                            <EnableDelegatesContent attrs={$delegates} {exitState} />
                        {/snippet}
                    </UniModal>
                    <ConfirmModal
                        bind:open={openModals.clearDelegates}
                        success={clearDelegates}
                    >
                        {#snippet trigger()}
                            <Dialog.Trigger class="btn preset-filled-error-500">
                                Clear Delegates
                            </Dialog.Trigger>
                        {/snippet}
                        {#snippet content()}
                            Are you sure you want to remove all delegates?
                        {/snippet}
                    </ConfirmModal>
                </div>
            </div>
            <!-- Delegate Table -->
            <div class="table-wrap rounded border border-surface-200-800">
                <table class="table">
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
                                    {...a11yLabel(`Edit ${attrs.name}`)}
                                    onclick={() => openModals.editDelegate = {
                                        state: true,
                                        id: attrs.id,
                                        attrs: attrs.getAttributes()
                                    }}
                                >
                                    <MdiPencil />
                                </button>
                                <button
                                    onclick={() => deleteDelegate(attrs.id)}
                                    {...a11yLabel(`Delete ${attrs.name}`)}
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
    </main>
</div>

<UniModal
    bind:open={openModals.editDelegate.state}
    onSubmit={(d: { attrs: DelegateAttrs }) => editDelegate(openModals.editDelegate.id, d)}
>
    {#snippet content(exitState)}
        <EditDelegateContent attrs={openModals.editDelegate.attrs} {exitState} />
    {/snippet}
</UniModal>
{/if}

<style>
    .panel {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        width: 75%;
        align-self: center;
    }
</style>