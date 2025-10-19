<!-- 
  @component The settings and admin navigation drawer, accessible on the right-hand side of the UI.

  This drawer allows users to visit different **admin** pages and configure various settings on the site.
 -->
<script lang="ts">
    import { Accordion } from "@skeletonlabs/skeleton-svelte";
    import { getContext } from "svelte";

    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import LightSwitch from "$lib/components/controls/LightSwitch.svelte";
    import PaletteSelector from "$lib/components/controls/PaletteSelector.svelte";
    import { getSessionContext, resetSessionContext } from "$lib/context/index.svelte";
    import { THEME_DEFAULTS, type Theme } from "$lib/context/theme.svelte";
    import { db, queryStore } from "$lib/db/index.svelte";
    import MdiPalette from "~icons/mdi/palette";
    import MdiPlus from "~icons/mdi/plus";
    import MdiReload from "~icons/mdi/reload";
    import MdiSquareRoundedOutline from "~icons/mdi/square-rounded-outline";
    import MdiStarOutline from "~icons/mdi/star-outline";
    import MdiWrench from "~icons/mdi/wrench";



    interface Props {
        /**
         * A method callback that "closes" the drawer that 
         * this navigation resides under.
         */
        close: () => void;

        /**
         * A bindable designating whether the backdrop for the modal
         * should be shown.
         */
        showBackdrop: boolean;
    }
    let { close, showBackdrop = $bindable() }: Props = $props();

    const prevSessions = queryStore(() => db.prevSessions.toCollection().keys(), []);
    const selectedSession = queryStore(() => db.getSessionValue("sessionKey"));
    const sessionData = getSessionContext();
    
    let accordion = $state<string[]>([]);
    let theme = getContext<Theme>("theme");

    /**
     * This implements the functionality of the "Add Session" button.
     * Saves the current session and creates a new session.
     */
    async function createNewSession() {
        await db.saveSessionData();
        await resetSessionContext(sessionData);
        goto(resolve("/dashboard/roll-call"));
    }

    // Hide backdrop when accordions are all closed.
    $effect(() => {
        showBackdrop = accordion.length == 0;
    });
</script>

<!-- External link to admin pages -->
<nav>
    <div class="flex p-2 gap-3 items-center">
        <h1 class="text-xl font-bold">Configure</h1>
        <MdiWrench />
    </div>
    <ul class="flex flex-col gap-1">
        <li class="flex">
            <a class="grow hover:preset-tonal p-2 rounded" onclick={close} href="{resolve("/admin/settings")}" tabindex="0">
                Settings
            </a>
        </li>
        <li class="flex">
            <a class="grow hover:preset-tonal p-2 rounded" onclick={close} target="_blank" href="{resolve("/admin/stats")}" tabindex="0">
                Stats
            </a>
        </li>
    </ul>
</nav>

<hr class="hr" />

<!-- Theming -->
<div class="flex flex-col p-2 gap-3">
    <div class="flex gap-3 items-center">
        <h1 class="text-xl font-bold">Theme</h1>
        <MdiPalette />
    </div>
    <div class="flex justify-between">
        Color Scheme <LightSwitch bind:colorScheme={theme.colorScheme} />
    </div>
    <Accordion value={accordion} multiple onValueChange={e => accordion = e.value}>
        <Accordion.Item value="primary" classes="text-primary-500">
            {#snippet lead()}<MdiStarOutline />{/snippet}
            {#snippet control()}Primary{/snippet}
            {#snippet panel()}
                <PaletteSelector bind:selectedColor={theme.primaryShade} colors={[
                    {id: "tw:red",          label: "Red",     displayShade: "var(--color-red-500)"},
                    {id: "tw:orange",       label: "Orange",  displayShade: "var(--color-orange-500)"},
                    {id: "tw:amber",        label: "Amber",   displayShade: "var(--color-amber-500)"},
                    {id: "tw:yellow",       label: "Yellow",  displayShade: "var(--color-yellow-500)"},
                    {id: "tw:lime",         label: "Lime",    displayShade: "var(--color-lime-500)"},
                    {id: "tw:green",        label: "Green",   displayShade: "var(--color-green-500)"},
                    {id: "tw:emerald",      label: "Emerald", displayShade: "var(--color-emerald-500)"},
                    {id: "tw:teal",         label: "Teal",    displayShade: "var(--color-teal-500)"},
                    {id: "tw:cyan",         label: "Cyan",    displayShade: "var(--color-cyan-500)"},
                    {id: "tw:sky",          label: "Sky",     displayShade: "var(--color-sky-500)"},
                    {id: "default-primary", label: "Blue",    displayShade: "var(--color-blue-500)"},
                    {id: "tw:indigo",       label: "Indigo",  displayShade: "var(--color-indigo-500)"},
                    {id: "tw:violet",       label: "Violet",  displayShade: "var(--color-violet-500)"},
                    {id: "tw:purple",       label: "Purple",  displayShade: "var(--color-purple-500)"},
                    {id: "tw:fuchsia",      label: "Fuchsia", displayShade: "var(--color-fuchsia-500)"},
                    {id: "tw:pink",         label: "Pink",    displayShade: "var(--color-pink-500)"},
                    {id: "tw:rose",         label: "Rose",    displayShade: "var(--color-rose-500)"},
                    {id: "tw:slate",        label: "Slate",   displayShade: "var(--color-slate-500)"},
                    {id: "tw:gray",         label: "Gray",    displayShade: "var(--color-gray-500)"},
                    {id: "tw:zinc",         label: "Zinc",    displayShade: "var(--color-zinc-500)"},
                    {id: "tw:neutral",      label: "Neutral", displayShade: "var(--color-neutral-500)"},
                    {id: "tw:stone",        label: "Stone",   displayShade: "var(--color-stone-500)"},
                ]} withCustom />
            {/snippet}
        </Accordion.Item>
        <Accordion.Item value="surface" classes="text-surface-500">
            {#snippet lead()}<MdiSquareRoundedOutline />{/snippet}
            {#snippet control()}Surface{/snippet}
            {#snippet panel()}
                <PaletteSelector bind:selectedColor={theme.surfaceShade} colors={[
                    {id: "default-surface", label: "Default", displayShade: "#666666"},
                    {id: "tw:slate-500",    label: "Slate",   displayShade: "var(--color-slate-500)"},
                    {id: "tw:gray-500",     label: "Gray",    displayShade: "var(--color-gray-500)"},
                    {id: "tw:zinc-500",     label: "Zinc",    displayShade: "var(--color-zinc-500)"},
                    {id: "tw:neutral-500",  label: "Neutral", displayShade: "var(--color-neutral-500)"},
                    {id: "tw:stone-500",    label: "Stone",   displayShade: "var(--color-stone-500)"},
                ]} withCustom />
            {/snippet}
        </Accordion.Item>
    </Accordion>
    <div class="flex">
        <button
            class="btn preset-tonal-surface border border-surface-500 grow"
            onclick={() => Object.assign(theme, THEME_DEFAULTS)}
        >
            <MdiReload />
            Reset Theme
        </button>
    </div>
</div>

<hr class="hr" />

<!-- Session management -->

<!-- A session row, which currently just consists of the "switch to this session" button -->
{#snippet sessionRow(key?: number)}
    {@const selected = $selectedSession === key}
    {@const displayKey = +(key ?? $prevSessions.length) + 1}
    <button
        class={["btn", selected ? "preset-ui-activated" : "preset-ui-depressed"]}
        onclick={() => { if (typeof key === "number" && !selected) db.loadSessionData(key); }}
        aria-label="Select{selected ? "ed" : ""} Session {displayKey}"
        aria-pressed={selected}
    >
        Session {displayKey}
    </button>
{/snippet}
<div class="p-2 flex flex-col gap-3">
    <div class="grid grid-cols-1 gap-1">
        <!-- All sessions -->
        {#each $prevSessions as sessionKey}
            {@render sessionRow(+sessionKey)}
        {/each}
        {#if typeof $selectedSession === "undefined"}
            {@render sessionRow(undefined)}
        {/if}
    </div>
    <!-- Add session button -->
    <button 
        class="btn preset-tonal-surface border border-surface-500" 
        onclick={createNewSession}
    >
        <MdiPlus />
        Add Session
    </button>
</div>