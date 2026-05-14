import { useEffect, useState } from "react";

export const useCountdown = ({ initialTimeInSeconds }) => {
  const [timeInSeconds, setTimeInSeconds] = useState(initialTimeInSeconds);

  useEffect(() => {
    const interValId = setInterval(() => {
      setTimeInSeconds((prevTime) => {
        if (prevTime <= 1) {
          return 0;
        }

        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interValId);
  }, []);

  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;

  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const displaySeconds = seconds < 10 ? `0${seconds}` : seconds;

  return {
    displayTime: `${displayMinutes}:${displaySeconds}`,
    isExpired: timeInSeconds <= 0,
    resetCountdown: () => setTimeInSeconds(initialTimeInSeconds),
  };
};
