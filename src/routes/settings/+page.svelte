<script lang="ts">
    import { base } from "$app/paths";
    import BarTitle from "$lib/dashboard/BarTitle.svelte";
    import LabeledSlideToggle from "$lib/dashboard/LabeledSlideToggle.svelte";
    import { SORT_KIND_NAMES, SORT_PROPERTY_NAMES } from "$lib/dashboard/points-motions/sort";
    import type { DelegateAttrs, Preferences } from "$lib/dashboard/types";
    import EditForm from "$lib/settings/EditForm.svelte";
    import { getSettingsContext, resetSettingsContext } from "$lib/stores/settings";
    import Icon from "@iconify/svelte";
    import { FileButton, getModalStore, type ModalSettings } from "@skeletonlabs/skeleton";
    import { get, type Writable } from "svelte/store";

    const settings = getSettingsContext();
    const { delegateAttributes, sortOrder, delegatesEnabled, title, preferences } = settings;
    let delsEnabledAll: boolean | undefined;
    $: {
        const [first, ...rest] = Object.keys($delegateAttributes).map(key => $delegatesEnabled[key]);
        delsEnabledAll = rest.every(k => k === first) ? first : undefined;
    }

    const PRESETS = {
        un: { label: "United Nations", delegates: "un_delegates", default: true },
        custom: { label: "Custom", delegates: undefined }
    };
    const PREFERENCES_LABELS = {
        enableMotionRoundRobin: { label: "Enable round robin" },
        enableMotionExt: { label: "Enable extensions" },
        pauseMainTimer: { label: "Pause main timer when delegate timer elapses" },
    } satisfies Record<keyof Preferences, unknown>;
    const _preferences: Writable<Record<string, boolean>> = preferences;
    const modalStore = getModalStore();
    let files: FileList;

    function modalAction(body: string, successCallback: () => void, errorCallback: () => void = () => {}) {
        const modal: ModalSettings = {
            type: "confirm",
            title: "Confirm",
            body,
            response: (r: boolean) => r ? successCallback() : errorCallback(),
        };
        modalStore.trigger(modal);
    }
    // IMPORT & EXPORT
    async function importFile() {
        const file = files.item(0);
        if (file) {
            const text = await file.text();
            const json = JSON.parse(text);
            for (let [key, store] of Object.entries(settings)) {
                if (key in json) store.set(json[key]);
            }
        }
    }
    function downloadFile(filename: string, contents: string, type: string) {
        // Creates file to download:
        const a = document.createElement("a");
        const blob = new Blob([contents], { type });
        const href = URL.createObjectURL(blob);
        a.href = href;
        a.download = filename;
        document.body.appendChild(a);

        // Downloads:
        a.click();

        // Teardown:
        setTimeout(() => {
            URL.revokeObjectURL(href);
            document.body.removeChild(a);
        }, 0);
    }
    function exportFile() {
        const exportSettings = Object.fromEntries(Object.entries(settings).map(
            ([k, v]) => [k, "subscribe" in v ? get<unknown>(v) : v]
        ));

        downloadFile("couchmun-config.json", JSON.stringify(exportSettings), "application/json");
    }
    function resetAllSettings() {
        modalAction("Are you sure you want to reset all settings?", () => {
            // Reset preset state cause it's not bound to settings
            currentPreset = (Object.keys(PRESETS) as (keyof typeof PRESETS)[])
                .find(p => "default" in PRESETS[p] && PRESETS[p].default)!;
            // Reset settings
            resetSettingsContext(settings);
        })
    }

    // DELEGATES
    let currentPreset: keyof typeof PRESETS;
    async function setPreset() {
        const delURL = PRESETS[currentPreset].delegates;
        if (typeof delURL === "string") {
            const { default: json } = await import(`$lib/delegate_presets/${delURL}.json`);
            delegateAttributes.set(structuredClone(json));
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
        modalAction("Are you sure you want to remove all delegates?", () => {
            delegateAttributes.set({});
            delegatesEnabled.set({});
            currentPreset = "custom";
        });
    }

    /**
     * Opens the delegate editing modal. This can also be used to add a new delegate.
     * @param key Key of delegate to edit (or undefined if adding a new delegate)
     */
    function editDelegate(key: string | undefined) {
        const compare = (a: any, b: any) => a < b ? -1 : a > b ? 1 : 0;
        modalStore.trigger({
            type: "component",
            component: {
                ref: EditForm,
                props: key ? { key, attrs: structuredClone($delegateAttributes[key]) } : {}
            },
            response({ key: newKey, attrs: newAttrs }: { key: string, attrs: DelegateAttrs }) {
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
    function deleteDelegate(key: string) {
        currentPreset = "custom";
        delegateAttributes.update($attrs => {
            delete $attrs[key];
            return $attrs;
        })
    }
</script>

<div class="flex flex-col p-4 gap-4">
    <div class="grid grid-cols-[36px_1fr_36px] items-center">
        <a href="{base}/dashboard" class="btn btn-icon">
            <Icon icon="mdi:chevron-left" width="36" height="36" />
        </a>
        <BarTitle bind:title={$title} />
    </div>
    <hr />
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
                on:click={exportFile}
            >
                Export to file...
            </button>
            <button
                class="btn variant-filled-error"
                on:click={resetAllSettings}
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
                                                <button on:click={() => key.ascending = !key.ascending}>
                                                    <Icon
                                                        icon="mdi:arrow-down"
                                                        class="{key.ascending ? 'rotate-180' : ''} transition-[transform]"
                                                        width="1.2rem"
                                                        height="1.2rem"
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
                <select class="select w-1/2" bind:value={currentPreset} on:change={setPreset}>
                    {#each Object.entries(PRESETS) as [value, preset]}
                    <option {value} label={preset.label} />
                    {/each}
                </select>
            </label>
            <div class="flex gap-3 justify-center">
                <button class="btn variant-filled-primary" on:click={() => editDelegate(undefined)}>Add Delegate</button>
                <button class="btn variant-filled-error" on:click={clearDelegates}>Clear Delegates</button>
            </div>
        </div>
        <!-- Delegate Table -->
        <div class="table-container">
            <table class="table table-compact del-table">
                <thead>
                    <tr>
                        <th>Key</th>
                        <th>Name</th>
                        <th class="text-center"><input class="checkbox" type="checkbox" bind:checked={delsEnabledAll} indeterminate={typeof delsEnabledAll === "undefined"} on:click={() => setAllEnableStatuses(!delsEnabledAll)}></th>
                        <th class="text-right">Configure</th>
                    </tr>
                </thead>
                <tbody>
                    {#each Object.entries($delegateAttributes) as [key, attrs]}
                    <tr>
                        <td>
                            <code>{key}</code>
                        </td>
                        <td class="w-full">{attrs.name}</td>
                        <td class="text-center">
                            <input class="checkbox" type="checkbox" bind:checked={$delegatesEnabled[key]}>
                        </td>
                        <td class="text-right">
                            <button on:click={() => editDelegate(key)}>
                                <Icon icon="mdi:wrench" width="24" height="24" />
                            </button>
                            <button on:click={() => deleteDelegate(key)}>
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