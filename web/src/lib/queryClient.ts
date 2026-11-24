import { MutationCache, QueryClient } from '@tanstack/react-query';

const mutationCache = new MutationCache({
  onSuccess: () => {
    void queryClient.invalidateQueries();
  },
});

export const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0,
      gcTime: 1000 * 60 * 10,
      refetchOnMount: 'always',
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    },
  },
});