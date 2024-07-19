import React, { useState } from 'react';

interface SpeakerQueueProps {
  speakers: { name: string; duration: number }[];
  addSpeaker: (name: string, duration: number) => void;
}

const SpeakerQueue: React.FC<SpeakerQueueProps> = ({ speakers, addSpeaker }) => {
  const [newSpeaker, setNewSpeaker] = useState(''); // State for the new speaker's name
  const [duration, setDuration] = useState(0); // State for the new speaker's duration

  // Function to handle the form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newSpeaker && duration > 0) {
      addSpeaker(newSpeaker, duration);
      setNewSpeaker('');
      setDuration(0);
    }
  };

  return (
    <div>
      <h2>Speaker Queue</h2>
      <ul>
        {speakers.map((speaker, index) => (
          <li key={index}>
            {speaker.name} - {speaker.duration}s
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newSpeaker}
          onChange={(e) => setNewSpeaker(e.target.value)}
          placeholder="Add a new speaker"
        />
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          placeholder="Duration (seconds)"
        />
        <button type="submit">Add Speaker</button>
      </form>
    </div>
  );
};

export default SpeakerQueue;
