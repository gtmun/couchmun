<script lang="ts">
    export let setPage: (page: string, params?: any) => void; // setPage function passed as a prop to navigate to different pages
  
    let topic: string = ''; // Variable to hold the topic for the moderated caucus
    let time: number = 60; // Variable to hold the time for each speaker in seconds
  
    // Function to set the moderated caucus with the specified topic and time
    function setModeratedCaucus() {
      setPage('moderated-caucus', { topic, time });
    }
  </script>
  
  <!-- Input fields to set the topic and time for the moderated caucus -->
  <div>
    <input type="text" bind:value={topic} placeholder="Topic" />
    <input type="number" bind:value={time} placeholder="Time in seconds" />
    <button on:click={setModeratedCaucus}>Set Moderated Caucus</button>
  </div>
  