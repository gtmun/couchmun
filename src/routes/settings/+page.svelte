<script lang="ts">
    import type { DelegateAttrs, Settings } from "$lib/dashboard/types";
    import EditForm from "$lib/settings/EditForm.svelte";
    import Icon from "@iconify/svelte";
    import { FileButton, getModalStore } from "@skeletonlabs/skeleton";
    import { getContext } from "svelte";
    import type { Readable } from "svelte/store";

    const settings = getContext<Settings>("settings");
    const { delegateAttributes, sortOrder, delegatesEnabled } = settings;
    let delsEnabledAll: boolean | undefined;
    $: {
        const [first, ...rest] = Object.values($delegatesEnabled);
        delsEnabledAll = rest.every(k => k === first) ? first : undefined;
    }

    const presets = {
        un: { label: "United Nations", delegates: "un_delegates" },
        custom: { label: "Custom", delegates: undefined }
    };
    const modalStore = getModalStore();
    let files: FileList;

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
        const exportSettings: { [P in keyof Settings]: Settings[P] extends Readable<infer I> ? I : Settings[P] } = {
            delegateAttributes: $delegateAttributes,
            sortOrder: $sortOrder,
            delegatesEnabled: $delegatesEnabled
        };

        downloadFile("couchmun-config.json", JSON.stringify(exportSettings), "application/json");
    }

    // DELEGATES
    let currentPreset: keyof typeof presets;
    async function setPreset() {
        const delURL = presets[currentPreset].delegates;
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
    function editDelegate(key: string) {
        const compare = (a: any, b: any) => a < b ? -1 : a > b ? 1 : 0;
        modalStore.trigger({
            type: "component",
            component: {
                ref: EditForm,
                props: { key, attrs: structuredClone($delegateAttributes[key]) }
            },
            response({ key: newKey, attrs: newAttrs }: { key: string, attrs: DelegateAttrs }) {
                delegateAttributes.update($attrs => {
                    let update = false;
                    if (key !== newKey) {
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

<div class="flex flex-col p-4">
    <hr />
    <div class="flex flex-col p-4 gap-3">
        <h3 class="h3 text-center">File Configuration</h3>
        <div class="flex gap-3 justify-center">
            <FileButton 
                name="import" 
                button="btn variant-filled-primary" 
                bind:files 
                on:change={importFile} 
                accept="application/json"
            >
                Import
            </FileButton>
            <button
                class="btn variant-filled-primary"
                on:click={exportFile}
            >
                Export
            </button>
        </div>
    </div>
    <hr />
    <div class="flex flex-col p-4 gap-3">
        <h3 class="h3 text-center">Sort Order</h3>
        <div class="flex gap-3">
            <code>
                {JSON.stringify($sortOrder)}
            </code>
        </div>
    </div>
    <hr />
    <div class="flex flex-col p-4 gap-3">
        <h3 class="h3 text-center">Delegates</h3>
        <div class="grid grid-cols-[1fr_2fr] items-center">
            <span>Apply Preset</span>
            <select class="select" bind:value={currentPreset} on:change={setPreset}>
                {#each Object.entries(presets) as [value, preset]}
                <option {value} label={preset.label} />
                {/each}
            </select>
        </div>
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
    .del-table td {
        vertical-align: middle;
    }
</style>