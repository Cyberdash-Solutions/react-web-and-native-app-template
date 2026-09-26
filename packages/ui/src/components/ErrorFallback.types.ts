export interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
  labels: { title: string; retry: string };
}
