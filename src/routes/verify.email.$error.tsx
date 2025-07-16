import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/verify/email/$error')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { error } = useParams({ from: '/verify/email/$error' });

  useEffect(() => {
    // Redirect to the new verification route with the error parameter
    navigate({ 
      to: '/verify/email', 
      search: { error },
      replace: true 
    });
  }, [error, navigate]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
        </div>
        <p className="text-muted-foreground">Redirecting to verification page...</p>
      </div>
    </div>
  );
} 