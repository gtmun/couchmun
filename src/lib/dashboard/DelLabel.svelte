<script lang="ts">
    import _delegates from "$lib/sample_delegates.json";
    import type { DelegateMap } from "./types";
    const delegates: DelegateMap = _delegates;

    export let speaker: string | undefined = undefined;
    export let height: string = "h-[25dvh]";

    function getSpeakerName(key: string | undefined) {
        if (typeof key === "undefined") return "-";
        return delegates[key]?.name ?? key;
    }

    type SpeakerImage = {
        url: URL,
        name: string
    };
    function getSpeakerImage(key: string): SpeakerImage {
        if (key in delegates) {
            return {
                url: new URL(key.toLowerCase() + ".svg", "https://flagcdn.com/"),
                name: delegates[key].name
            };
        } else {
            // Default: UN
            return {
                url: new URL("https://flagcdn.com/un.svg"),
                name: "United Nations"
            }
        }
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