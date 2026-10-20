import { useState, useEffect } from 'react';

export const getSriLankaToday = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

export const useSriLankaToday = (): string => {
  const [today, setToday] = useState<string>(getSriLankaToday);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getSriLankaToday();
      setToday((prev) => (prev !== current ? current : prev));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return today;
};
