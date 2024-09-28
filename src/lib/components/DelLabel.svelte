<script lang="ts">
    import { getFlagUrl } from "$lib/flags/flagcdn";
    import { getSessionDataContext } from "$lib/stores/session";

    const { settings: { delegateAttributes } } = getSessionDataContext();

    export let key: string;
    export let height: string | undefined = undefined;
    export let inline: boolean = false;
    $: _height = height ?? (inline ? "h-4" : "h-[25dvh]");

    function getSpeakerLabel(key: string | undefined) {
        if (typeof key === "undefined") return "";
        return $delegateAttributes[key]?.name ?? key;
    }
    type SpeakerImage = {
        url: URL,
        label: string
    };
    function getSpeakerImage(key: string): SpeakerImage {
        let url = getFlagUrl(key) ?? getFlagUrl("un")!;
        let label = getSpeakerLabel(key);
        return { url, label };
    }
    const imgData = getSpeakerImage(key);
</script>

{#if inline}
<div class="flex items-center gap-1">
    <img
        src={imgData.url.toString()}
        alt="Flag of {imgData.label}"
        class={_height}
    >
    {getSpeakerLabel(key)}
</div>
{:else}
<div class="flex flex-col items-center gap-3">
    <h2 class="h2">{getSpeakerLabel(key)}</h2>
    <img
        src={imgData.url.toString()}
        alt="Flag of {imgData.label}"
        class={_height}
    >
</div>
{/if}