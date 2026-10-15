import { useEffect, useRef } from 'react';

export function useRealtimeNotifications(onEvent?: (event: { type: string; data: any }) => void) {
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
    const eventSourceUrl = `${apiBase}/api/events`;

    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(eventSourceUrl);

      eventSource.addEventListener('patient_registered', (e) => {
        try {
          const data = JSON.parse(e.data);
          onEventRef.current?.({ type: 'patient_registered', data });
        } catch (err) {
          console.error('SSE JSON parse error:', err);
        }
      });

      eventSource.addEventListener('vitals_recorded', (e) => {
        try {
          const data = JSON.parse(e.data);
          onEventRef.current?.({ type: 'vitals_recorded', data });
        } catch (err) {
          console.error('SSE JSON parse error:', err);
        }
      });

      eventSource.onerror = () => {
        // Suppress console spam; browser automatically retries EventSource
      };
    } catch (err) {
      console.error('Failed to establish EventSource connection:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);
}
