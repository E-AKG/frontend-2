import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to invalidate related queries when data changes
 * This ensures that all related views stay in sync
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  const invalidateSollstellungen = () => {
    queryClient.invalidateQueries({ queryKey: ['billRuns'] });
    queryClient.invalidateQueries({ queryKey: ['charges'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  };

  const invalidateTenants = () => {
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
    // Also invalidate Sollstellungen as tenant changes affect them
    invalidateSollstellungen();
  };

  const invalidateLeases = () => {
    queryClient.invalidateQueries({ queryKey: ['leases'] });
    // Also invalidate Sollstellungen as lease changes affect them
    invalidateSollstellungen();
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };

  return {
    invalidateSollstellungen,
    invalidateTenants,
    invalidateLeases,
    invalidateAll,
  };
}

