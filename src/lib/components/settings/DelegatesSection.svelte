<script lang="ts">
    import { Accordion, Dialog, FileUpload } from "@skeletonlabs/skeleton-svelte";
    import * as csv from 'csv/browser/esm/sync';
    import { slide } from "svelte/transition";

    import DelLabel from "../del-label/DelLabel.svelte";
    import ConfirmModal from "../modals/ConfirmModal.svelte";
    import EditDelegateContent from "../modals/EditDelegateContent.svelte";
    import UniModal from "../modals/UniModal.svelte";

    import { Delegate } from "$lib/db/delegates";
    import { _legacyFixDelFlag, SessionDatabase } from "$lib/db/index.svelte";
    import { PRESETS } from "$lib/delegate_presets";
    import type { DelegateAttrs, DelegateID } from "$lib/types";
    import { a11yLabel, downloadFile, hasKey } from "$lib/util";
    import MdiCancel from "~icons/mdi/cancel";
    import MdiChevronDown from "~icons/mdi/chevron-down";
    import MdiDelete from "~icons/mdi/delete";
    import MdiExport from "~icons/mdi/export";
    import MdiImport from "~icons/mdi/import";
    import MdiPencil from "~icons/mdi/pencil";
    import MdiPlus from "~icons/mdi/plus";
    import MdiUpdate from "~icons/mdi/update";

    
    interface Props {
        /**
         * Database, which contains settings. Used to set delegates.
        */
        db: SessionDatabase,
        /**
         * List of delegates (used for displaying states)
         */
        delegates: Delegate[],

        resetAllSessionData: () => Promise<void>,
        setPreset: (preset: string) => Promise<void>,
    }
    let { db, delegates, resetAllSessionData, setPreset }: Props = $props();
    let delsEnabledAll = $derived.by(() => {
        const [first, ...rest] = delegates.map(del => del.enabled);
        return rest.every(k => k === first) ? first : undefined;
    });

    let openModals = $state({
        clearDelegates: false,
        applyPreset: false,
        editDelegate: {
            state: false,
            id: undefined,
            attrs: emptyAttrs(),
        } as { state: boolean, id?: DelegateID, attrs: DelegateAttrs }
    });
    let inputPreset = $state("");

    let importRosterStatus = $state.raw<{ type: "success" } | { type: "error", error: string }>();
    const headers = ["name", "aliases", "flag_url"];
    
    /// A set of functions to normalize data to the given type.
    const csv_norm = {
        str: s => s ? s.trim() : "",
        arr: s => s ? s.split("|").map(e => e.trim()).filter(e => e) : [],
        bool: s => !!+(s ?? 0),
    } satisfies Record<string, (s?: string) => unknown>;

    async function importRosterFile(files: File[]) {
        const [file] = files;
        if (file) {
            const text = await file.text();
            
            importRosterStatus = { type: "success" };
            setTimeout(() => importRosterStatus = undefined, 3000);

            let data: Record<string, string>[];
            try {
                data = csv.parse(text, { columns: true });

                if (data.length > 0) {
                    const first = data[0];
                    let enableMap: Map<string, boolean> | undefined = undefined;
                    
                    // Assert headers are correct + specially handle "enabled" column
                    const missingHeader = headers.find(h => !hasKey(first, h));
                    if (missingHeader) {
                        throw new Error(`Missing header: ${missingHeader}. The parsed headers were: ${JSON.stringify(Object.keys(first))}`)
                    }
                    if (hasKey(first, "enabled")) {
                        // eslint-disable-next-line svelte/prefer-svelte-reactivity
                        enableMap = new Map<string, boolean>();
                        for (let d of data) {
                            enableMap.set(d.name, csv_norm.bool(d.enabled));
                        }
                    }
    
                    /// Wipe & reload delegates
                    return db.transaction("rw", db.delegates, async () => {
                        await db.delegates.clear();
                        await db.addDelegates(data.map<DelegateAttrs>(d => ({
                            name: csv_norm.str(d.name),
                            aliases: csv_norm.arr(d.aliases),
                            flagURL: csv_norm.str(d.flag_url)
                        })));

                        if (typeof enableMap !== "undefined") {
                            await db.delegates.toCollection()
                                .modify(d => {
                                    const result = enableMap.get(d.name);
                                    if (typeof result === "boolean") {
                                        d.enabled = result;
                                    }
                                });
                        }
                    });
                }
            } catch (e) {
                importRosterStatus = { type: "error", error: String(e) };
                return;
            }
        }
    }
    function exportRosterFile() {
        const text = csv.stringify([
            headers,
            ...delegates.map(d => [d.name, d.aliases.join('|'), d.flagURL ?? ""])
        ]);
        downloadFile("roster.csv", text, "text/csv");
    }
    async function clearDelegates() {
        await db.delegates.clear();
    }

    let visDisabled = $state("");
    let visEnabled = $state("");
    async function importVisFile(files: File[], enabledStatus: boolean) {
        const [file] = files;
        if (file) {
            const text = await file.text();
            if (enabledStatus) {
                visEnabled = text;
            } else {
                visDisabled = text;
            }
        }
    }
    function processVis(text: string): [ids: Set<DelegateID>, remainder: string] {
        // eslint-disable-next-line svelte/prefer-svelte-reactivity
        let ids = new Set<DelegateID>();
        let remainder: string[] = [];

        for (let line of text.split("\n")) {
            line = line.trim();
            let item = delegates.find(d => d.nameEquals(line));
            if (item) {
                ids.add(item.id);
            } else {
                remainder.push(line);
            }
        }

        return [ids, remainder.join("\n")]
    }
    async function applyVis(ids: Set<DelegateID>, enabledStatus: boolean) {
        return db.transaction("rw", db.delegates, async () => {
            return db.delegates.toCollection().modify(d => {
                if (ids.has(d.id)) {
                    d.enabled = enabledStatus;
                }
            })
        });
    }
    async function updateVis() {
        // Enabled:
        const [enIds, enRemainder] = processVis(visEnabled);
        visEnabled = enRemainder;
        await applyVis(enIds, true);

        // Disabled:
        const [diIds, diRemainder] = processVis(visDisabled);
        visDisabled = diRemainder;
        await applyVis(diIds, false);
    }

    async function setAllEnableStatuses(enabled: boolean) {
        db.transaction("rw", db.delegates, async () => {
            await db.delegates.toCollection().modify({ enabled });
        })
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
</script>

<!-- Delegate Main Settings -->
<h3 class="h3 text-center" id="delegates">
    Delegates
</h3>
<Accordion collapsible multiple>
    <hr class="hr" />
    <!-- Roster accordion -->
    <Accordion.Item value="delegate-edit-roster">
        <h3>
            <Accordion.ItemTrigger class="nav-header flex items-center justify-between gap-2">
                Roster
                <Accordion.ItemIndicator class="group">
                    <MdiChevronDown class="h-5 w-5 transition group-data-[state=open]:rotate-180" />
                </Accordion.ItemIndicator>
            </Accordion.ItemTrigger>
        </h3>
        <Accordion.ItemContent>
            {#snippet element(attributes)}
                {#if !attributes.hidden}
                    <div {...attributes} transition:slide={{ duration: 150 }}>
                        <div class="flex flex-col gap-3">
                            <div class="italic text-center">
                                Bulk configure the list of delegations to include for this committee. <br>
                                If the list of expected delegations is a subset of a larger preset,
                                consider using the <span class="font-bold">Visibility</span> configuration
                                instead.
                            </div>
                            <label class="flex gap-3 justify-center items-center">
                                <span>Apply Preset</span>
                                <select class="select w-1/2" bind:value={inputPreset} onchange={() => openModals.applyPreset = true}>
                                    <option disabled selected value>-- Select preset --</option>
                                    {#each Object.entries(PRESETS) as [value, preset] (value)}
                                        <option {value} label={preset.label}></option>
                                    {/each}
                                </select>
                                <ConfirmModal
                                    bind:open={openModals.applyPreset}
                                    success={() => {
                                        inputPreset = "";
                                        setPreset(inputPreset);
                                        return resetAllSessionData();
                                    }}
                                    failure={() => inputPreset = ""}
                                >
                                    {#snippet content()}
                                        {@const label = (PRESETS as any)[inputPreset]?.label ?? "none" }
                                        Are you sure you want to change the roster preset to "{label}"?
                                        This will also wipe all previous and current session data.
                                    {/snippet}
                                </ConfirmModal>
                                <ConfirmModal
                                    bind:open={openModals.clearDelegates}
                                    success={clearDelegates}
                                >
                                    {#snippet trigger()}
                                        <Dialog.Trigger
                                            class="btn-icon-std preset-filled-error-500"
                                            title="Remove All Delegates"
                                            aria-label="Remove All Delegates"
                                        >
                                            <MdiDelete />
                                        </Dialog.Trigger>
                                    {/snippet}
                                    {#snippet content()}
                                        Are you sure you want to remove all delegates?
                                    {/snippet}
                                </ConfirmModal>
                            </label>
                            <FileUpload
                                name="roster-import"
                                accept="text/csv"
                                onFileAccept={(e) => importRosterFile(e.files)}
                            >
                                <FileUpload.Label>Upload a CSV (headers: {headers.join(', ')})</FileUpload.Label>
                                <FileUpload.Dropzone
                                    class={[
                                        "transition-colors duration-150",
                                        importRosterStatus?.type === "success" && "preset-filled-success-100-900",
                                        importRosterStatus?.type === "error" && "preset-filled-error-100-900",
                                    ]}
                                >
                                    <span>Select file or drag here.</span>
                                    <FileUpload.Trigger>Browse Files</FileUpload.Trigger>
                                    <FileUpload.HiddenInput />
                                </FileUpload.Dropzone>
                                {#if importRosterStatus?.type === "error"}
                                <div class="text-center text-error-500" transition:slide={{ duration: 150 }}>
                                    { importRosterStatus.error }
                                </div>
                                {/if}
                            </FileUpload>
                            <div class="flex justify-end">
                                <button class="btn preset-filled" onclick={exportRosterFile}>
                                    <MdiExport />
                                    Export Roster
                                </button>
                            </div>
                        </div>
                    </div>
                {/if}
            {/snippet}
        </Accordion.ItemContent>
    </Accordion.Item>
    <hr class="hr" />
    <!-- Visibility accordion -->
    <Accordion.Item value="delegate-toggle-visibility">
        <h3>
            <Accordion.ItemTrigger class="nav-header flex items-center justify-between gap-2">
                Visibility
                <Accordion.ItemIndicator class="group">
                    <MdiChevronDown class="h-5 w-5 transition group-data-[state=open]:rotate-180" />
                </Accordion.ItemIndicator>
            </Accordion.ItemTrigger>
        </h3>
        <Accordion.ItemContent>
            {#snippet element(attributes)}
                {#if !attributes.hidden}
                    <div {...attributes} transition:slide={{ duration: 150 }}>
                        <div class="flex flex-col gap-3">
                            <div class="italic text-center">
                                Bulk set the visibility of all delegations. <br>
                                If a delegation is set to not visible, then it will not appear in roll call or in committee.
                                This acts as a "soft deletion." The delegation effectively does not exist,
                                but can be easily reinstated without having to manually reenter all of their information.
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <div class="flex text-sm font-bold justify-between items-center">
                                        <div>Type delegates to enable (sep. by new lines):</div>
                                            <FileUpload
                                                name="visibility-enable-import"
                                                accept="text/*"
                                                onFileAccept={e => importVisFile(e.files, true)}
                                                class="w-fit"
                                            >
                                                <FileUpload.Trigger
                                                    class="btn-icon"
                                                    title="Import Delegates to Enable"
                                                    aria-label="Import Delegates to Enable"
                                                >
                                                    <MdiImport />
                                                </FileUpload.Trigger>
                                                <FileUpload.HiddenInput />
                                            </FileUpload>
                                    </div>
                                    <textarea class="textarea" rows={10} bind:value={visEnabled}></textarea>
                                </div>
                                <div>
                                    <div class="flex text-sm font-bold justify-between items-center">
                                        <div>Type delegates to disable (sep. by new lines):</div>
                                            <FileUpload
                                                name="visibility-disable-import"
                                                accept="text/*"
                                                onFileAccept={e => importVisFile(e.files, false)}
                                                class="w-fit"
                                            >
                                                <FileUpload.Trigger
                                                    class="btn-icon"
                                                    title="Import Delegates to Disable"
                                                    aria-label="Import Delegates to Disable"
                                                >
                                                    <MdiImport />
                                                </FileUpload.Trigger>
                                                <FileUpload.HiddenInput />
                                            </FileUpload>
                                    </div>
                                    <textarea class="textarea" rows={10} bind:value={visDisabled}></textarea>
                                </div>
                            </div>
                            <div class="italic font-bold text-center">
                                If a name persists, then it could not be resolved into a delegate.
                            </div>
                            <div class="flex justify-end">
                                <button class="btn preset-filled" onclick={updateVis}>
                                    <MdiUpdate />
                                    Update Roster
                                </button>
                            </div>
                        </div>
                    </div>
                {/if}
            {/snippet}
        </Accordion.ItemContent>
    </Accordion.Item>
    <hr class="hr" />
</Accordion>
<div class="flex gap-3 justify-end">
    <button
        class="btn preset-filled-primary-500"
        onclick={() => openModals.editDelegate = { state: true, attrs: emptyAttrs() }}
    >
        <MdiPlus />
        Add Delegate
    </button>
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
            {#each delegates as attrs (attrs.id)}
            <tr class={["transition-colors", !attrs.enabled && "bg-surface-100-900"]}>
                <td class="w-full">
                    <DelLabel {attrs} inline fallbackFlag="icon" />
                </td>
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

<UniModal
    bind:open={openModals.editDelegate.state}
    onSubmit={(d: { attrs: DelegateAttrs }) => editDelegate(openModals.editDelegate.id, d)}
>
    {#snippet content(exitState)}
        <EditDelegateContent attrs={openModals.editDelegate.attrs} {exitState} />
    {/snippet}
</UniModal>