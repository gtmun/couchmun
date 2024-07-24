<script lang="ts">
    import RollCall from '$lib/panel/RollCall.svelte'; // Import RollCall component
    import ModeratedCaucus from '$lib/panel/ModeratedCaucus.svelte'; // Import ModeratedCaucus component
    import SpeakerList from '$lib/panel/SpeakerList.svelte'; // Import SpeakerList component
    import PointsAndMotions from '$lib/panel/PointsAndMotions.svelte'; // Import PointsAndMotions component
  
    let page: string = 'roll-call'; // Variable to track the current page
    let pageParams: { topic: string, time: number } = { topic: '', time: 60 }; // Parameters for the current page
  
    // Function to set the current page and its parameters
    function setPage(newPage: string, params: { topic?: string, time?: number } = {}) {
      page = newPage;
      pageParams.topic = params.topic ?? '';
      pageParams.time = params.time !== undefined ? params.time : 60;
    }
  </script>
  
  <!-- Navigation buttons to switch between different pages -->
  <nav>
    <button on:click={() => setPage('roll-call')}>Roll Call</button>
    <button on:click={() => setPage('moderated-caucus')}>Moderated Caucus</button>
    <button on:click={() => setPage('speaker-list')}>Speaker List</button>
    <button on:click={() => setPage('points-motions')}>Points and Motions</button>
  </nav>
  
  <!-- Conditional rendering of the current page based on the page variable -->
  {#if page === 'roll-call'}
    <RollCall />
  {:else if page === 'moderated-caucus'}
    <ModeratedCaucus topic={pageParams.topic} time={pageParams.time} />
  {:else if page === 'speaker-list'}
    <SpeakerList />
  {:else if page === 'points-motions'}
    <PointsAndMotions {setPage} />
  {/if}
  