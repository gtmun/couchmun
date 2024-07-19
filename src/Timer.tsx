import React, { useState, useEffect } from 'react';

interface TimerProps {
  currentSpeaker: { name: string; duration: number } | null;
  startNextSpeaker: () => void;
}

const Timer: React.FC<TimerProps> = ({ currentSpeaker, startNextSpeaker }) => {
  const [time, setTime] = useState(0); // State for the remaining time
  const [isRunning, setIsRunning] = useState(false); // State to track if the timer is running
  let timer: NodeJS.Timeout | null = null; // Timer variable to store the interval

  // Effect to handle the timer countdown
  useEffect(() => {
    if (isRunning) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (!isRunning && time !== 0) {
      clearInterval(timer!);
    }
    return () => clearInterval(timer!);
  }, [isRunning, time]);

  // Effect to start or reset the timer when the current speaker changes
  useEffect(() => {
    if (currentSpeaker) {
      setTime(currentSpeaker.duration);
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  }, [currentSpeaker]);

  // Effect to handle when the time reaches zero
  useEffect(() => {
    if (currentSpeaker && time <= 0) {
      alert(`Time's up for ${currentSpeaker.name}`);
      handleStop();
    }
  }, [time, currentSpeaker]);

  // Function to stop the timer and start the next speaker
  const handleStop = () => {
    setIsRunning(false);
    startNextSpeaker();
  };

  return (
    <div>
      <h2>Current Speaker: {currentSpeaker?.name || 'None'}</h2>
      <h3>Time: {time}s</h3>
      {isRunning ? (
        <button onClick={handleStop}>Stop</button>
      ) : (
        <button onClick={() => setIsRunning(true)}>Start</button>
      )}
    </div>
  );
};

export default Timer;
