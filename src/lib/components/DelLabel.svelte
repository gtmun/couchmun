<script lang="ts">
    import { getFlagUrl } from "$lib/flags/flagcdn";
    import { getSessionDataContext } from "$lib/stores/session";

    const { settings: { delegateAttributes } } = getSessionDataContext();

    export let speaker: string | undefined = undefined;
    export let height: string = "h-[25dvh]";

    function getSpeakerName(key: string | undefined) {
        if (typeof key === "undefined") return "";
        return $delegateAttributes[key]?.name ?? key;
    }
    type SpeakerImage = {
        url: URL,
        name: string
    };
    function getSpeakerImage(key: string): SpeakerImage {
        let url = getFlagUrl(key) ?? getFlagUrl("un")!;
        let name = getSpeakerName(key);
        return { url, name };
    }
</script>

<div class="flex flex-col items-center gap-3">
    <h2 class="h2">{getSpeakerName(speaker)}</h2>
    {#if typeof speaker !== "undefined"}
        {@const imgData = getSpeakerImage(speaker)}
        <img
            src={imgData.url.toString()}
            alt="Flag of {imgData.name}"
            class={height}
        >
    {/if}
</div>