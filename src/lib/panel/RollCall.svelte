<script lang="ts">
    // Define a Participant type with name and status
    type Participant = {
      name: string;
      status: 'Not Present' | 'Present' | 'Present and Voting';
    };
  
    // Initialize an array of participants with default statuses
    let participants: Participant[] = [
      { name: "Participant 1", status: "Not Present" },
      { name: "Participant 2", status: "Not Present" },
      // Add more participants here
    ];
  
    // Function to update the status of a participant
    function updateStatus(index: number, status: Participant['status']) {
      participants[index].status = status;
    }
  </script>
  
  <!-- Render a table to display participants and their statuses -->
  <table>
    <thead>
      <tr>
        <th>Participant</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {#each participants as participant, index}
        <tr>
          <td>{participant.name}</td>
          <td>
            <select bind:value={participant.status} on:change={() => updateStatus(index, participant.status)}>
              <option value="Not Present">Not Present</option>
              <option value="Present">Present</option>
              <option value="Present and Voting">Present and Voting</option>
            </select>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
  