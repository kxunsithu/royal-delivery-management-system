import { AppState, type AppStateStatus } from 'react-native';
import { focusManager, MutationCache, QueryClient } from '@tanstack/react-query';

// ─── App focus ───────────────────────────────────────────────────────────────
// React Query does not know about React Native's app lifecycle by default, so
// "refetch on focus" never fires. Wire it to AppState so data is refreshed when
// the user comes back to the app (e.g. after using another device).
focusManager.setEventListener((handleFocus) => {
  const onChange = (status: AppStateStatus) => {
    handleFocus(status === 'active');
  };
  const subscription = AppState.addEventListener('change', onChange);
  return () => subscription.remove();
});

// ─── Global mutation invalidation ────────────────────────────────────────────
// Every successful write (create / update / delete / status change / action)
// means server data changed. Invalidate all cached queries so lists, detail
// screens and dashboard cards update in place — no page/app reload required.
// Individual mutations may still invalidate specific keys; this is a safety net
// so a newly added mutation can never leave stale data behind.
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
      // Data is considered stale immediately: mounting/focusing a screen always
      // shows fresh server data instead of a 5-minute-old cache.
      staleTime: 0,
      gcTime: 1000 * 60 * 10,
      refetchOnMount: 'always',
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    },
  },
});
