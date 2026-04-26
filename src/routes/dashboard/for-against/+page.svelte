<script lang="ts">
    import ForAgainst from "$lib/components/ForAgainst.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";

    const sessionData = getSessionContext();
    const { delegates, faSpeakersList } = sessionData;

    let duration: number = $state(60);
</script>

<ForAgainst
    delegates={$delegates}
    bind:order={$faSpeakersList}
    {duration}
/>
