<!--
  @component The admin settings page (used for configuring settings).
-->
<script lang="ts">
    import { FileUpload, Dialog, Navigation } from "@skeletonlabs/skeleton-svelte";
    
    import MetaTags from "$lib/components/MetaTags.svelte";
    import ConfirmModal from "$lib/components/modals/ConfirmModal.svelte";
    import DelegatesSection from "$lib/components/settings/DelegatesSection.svelte";
    import MotionsSection from "$lib/components/settings/MotionsSection.svelte";
    import PreferencesSection from "$lib/components/settings/PreferencesSection.svelte";
    import SortOrderSection from "$lib/components/settings/SortOrderSection.svelte";
    import { _legacyFixDelFlag, db, queryStore } from "$lib/db/index.svelte";
    import { toKeyValueArray, toObject } from "$lib/db/keyval";
    import { DEFAULT_PRESET_KEY, getPreset } from "$lib/delegate_presets";
    import type { Settings } from "$lib/types";
    import { downloadFile } from "$lib/util";

    const settings = queryStore(async () => toObject(await db.settings.toArray()) as Settings);

    let delegates = queryStore(() => db.delegates.orderBy("order").toArray(), []);
    
    let openModals = $state({
        resetAllSettings: false
    });

    // NAVIGATION
    let mainContent = $state<HTMLElement>();
    function getHeaders(): [string, string][] {
        return Array.from(
            mainContent?.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]") ?? [],
            e => [e.id, e.textContent!]
        );
    }

    // IMPORT & EXPORT
    async function importSettingsFile(files: File[]) {
        const [file] = files;
        if (file) {
            const text = await file.text();
            const json = JSON.parse(text);

            // TODO: input validation
            let { settings: newSettings, delegates: newDelegates } = json;
            await db.transaction("rw", [db.sessionData, db.settings, db.delegates], async () => {
                // Update settings
                await db.resetSettings();
                await db.settings.bulkUpdate(toKeyValueArray(newSettings).map(({ key, val }) => ({ key, changes: { val }})));

                // Clear sessions
                await resetAllSessionData();

                // Update delegates
                await db.delegates.clear();
                await db.addDelegates(newDelegates);
            })
        }
    }
    function exportSettingsFile() {
        if (!$settings || !$delegates) return;
        let exportSettings = {
            settings: $settings,
            // HACK: Allows enabled to exist
            delegates: $delegates.map(d => Object.assign(d.getAttributes(), { enabled: d.enabled }))
        };

        downloadFile("couchmun-config.json", JSON.stringify(exportSettings), "application/json");
    }

    async function resetAllSessionData() {
        // Remove session data + previous sessions.
        await db.resetSessionData();
        await db.prevSessions.clear();
    }
    async function resetAllSettings() {
        // Reset settings
        await db.resetSettings();
        await setPreset(DEFAULT_PRESET_KEY);
        // Reset session data
        await resetAllSessionData();
    }

    async function setPreset(presetKey: string) {
        const preset = await getPreset(presetKey);
        if (typeof preset !== "undefined") {
            let entries = _legacyFixDelFlag(preset);
            await db.transaction("rw", db.delegates, async () => {
                await db.delegates.clear();
                await db.addDelegates(entries);
            });
        }
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
            <!-- Import/Export options -->
            <h3 class="h3 text-center" id="control-panel">Control Panel</h3>
            <div class="flex gap-3 justify-center">
                <FileUpload
                    name="settings-import"
                    accept="application/json"
                    onFileAccept={e => importSettingsFile(e.files)}
                    class="w-fit"
                >
                    <FileUpload.Trigger class="btn preset-filled-primary-500">
                        Import from file...
                    </FileUpload.Trigger>
                    <FileUpload.HiddenInput />
                </FileUpload>
                <button
                    class="btn preset-filled-primary-500"
                    onclick={exportSettingsFile}
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
                        Are you sure you want to reset all settings? This will also wipe all previous and current session data.
                    {/snippet}
                </ConfirmModal>
            </div>
        </div>
        <hr class="hr" />
        <div class="panel">
            <PreferencesSection {db} preferences={$settings.preferences} />
        </div>
        <hr class="hr" />
        <div class="panel">
            <MotionsSection />
        </div>
        <hr class="hr" />
        <div class="panel">
            <SortOrderSection {db} sortOrder={$settings.sortOrder} />
        </div>
        <hr class="hr" />
        <div class="panel">
            <DelegatesSection {db} delegates={$delegates} {resetAllSessionData} {setPreset} />
        </div>
        <hr class="hr" />
    </main>
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
</style>