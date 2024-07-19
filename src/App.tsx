import React, { useState } from 'react';
import Timer from './Timer';
import SpeakerQueue from './SpeakerQueue';

interface Speaker {
  name: string;
  duration: number; // duration in seconds
}

const App: React.FC = () => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker | null>(null);

  // Function to add a new speaker to the queue
  const addSpeaker = (name: string, duration: number) => {
    setSpeakers([...speakers, { name, duration }]);
  };

  // Function to start the next speaker in the queue
  const startNextSpeaker = () => {
    if (speakers.length > 0) {
      setCurrentSpeaker(speakers[0]);
      setSpeakers(speakers.slice(1));
    } else {
      setCurrentSpeaker(null);
    }
  };

  return (
    <div>
      <h1>Speaker Timer</h1>
      <Timer currentSpeaker={currentSpeaker} startNextSpeaker={startNextSpeaker} />
      <SpeakerQueue speakers={speakers} addSpeaker={addSpeaker} />
    </div>
  );
};

export default App;
