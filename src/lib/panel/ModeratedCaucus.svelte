<script lang="ts">
    import { onMount } from 'svelte'; // Import onMount lifecycle function
    import { writable } from 'svelte/store'; // Import writable store from Svelte
  
    export let topic: string; // Topic of the moderated caucus passed as a prop
    export let time: number; // Time for each speaker passed as a prop
  
    let timer = writable(time); // Create a writable store for the timer
    let interval: NodeJS.Timeout; // Variable to store the interval ID
  
    let speakers: string[] = []; // Array to store the list of speakers
    let newSpeaker: string = ''; // Variable to hold the name of the new speaker being added
    let currentSpeakerIndex: number = -1; // Index of the current speaker
    let isPaused: boolean = true; // Boolean to track if the timer is paused
  
    // Function to add a new speaker to the list
    function addSpeaker() {
      if (newSpeaker.trim()) {
        speakers.push(newSpeaker.trim());
        newSpeaker = '';
      }
    }
  
    // Function to start the timer interval
    function startTimer() {
      clearInterval(interval); // Clear any existing interval
      interval = setInterval(() => {
        if (!isPaused && $timer > 0) {
          timer.update(n => n - 1); // Decrease the timer value every second
        }
        if ($timer === 0) {
          removeCurrentSpeaker(); // Remove the speaker when time is up
        }
      }, 1000);
    }
  
    // Function to toggle the pause state of the timer
    function pauseTimer() {
      isPaused = !isPaused;
    }
  
    // Function to move to the next speaker
    function nextSpeaker() {
      if (speakers.length > 0) {
        currentSpeakerIndex = (currentSpeakerIndex + 1) % speakers.length; // Move to next speaker
        timer.set(time); // Reset the timer
        isPaused = true; // Pause the timer
      }
    }
  
    // Function to remove the current speaker from the list
    function removeCurrentSpeaker() {
      if (currentSpeakerIndex >= 0 && speakers.length > 0) {
        speakers.splice(currentSpeakerIndex, 1); // Remove the current speaker
        if (speakers.length === 0) {
          currentSpeakerIndex = -1; // Reset the speaker index if list is empty
          clearInterval(interval); // Clear the interval
        } else {
          currentSpeakerIndex = currentSpeakerIndex % speakers.length; // Update the current speaker index
          timer.set(time); // Reset the timer
          isPaused = true; // Pause the timer
        }
      }
    }
  
    // Function to reset and start the timer
    function resetTimer() {
      clearInterval(interval); // Clear any existing interval
      timer.set(time); // Reset the timer
      startTimer(); // Start the timer
    }
  
    // Set up the timer when the component is mounted
    onMount(() => {
      startTimer();
      return () => clearInterval(interval); // Clear the interval when the component is destroyed
    });
  </script>
  
  <h1>Moderated Caucus</h1>
  <p>Topic: {topic}</p>
  
  <!-- Input field and button to add a new speaker -->
  <div>
    <input type="text" bind:value={newSpeaker} placeholder="Add speaker" />
    <button on:click={addSpeaker}>Add Speaker</button>
  </div>
  
  <!-- Display the list of speakers -->
  <ul>
    {#each speakers as speaker, index}
      <li class="{index === currentSpeakerIndex ? 'current' : ''}">{speaker}</li>
    {/each}
  </ul>
  
  <!-- Display the current speaker if any -->
  {#if currentSpeakerIndex >= 0}
    <p>Current Speaker: {speakers[currentSpeakerIndex]}</p>
  {/if}
  
  <p>Time left: {$timer} seconds</p>
  
  <!-- Buttons to control the timer and skip to the next speaker -->
  <div>
    <button on:click={pauseTimer}>{isPaused ? 'Resume' : 'Pause'} Timer</button>
    <button on:click={nextSpeaker}>Skip to Next Speaker</button>
  </div>
  
  <style>
    .current {
      font-weight: bold;
    }
  </style>
  