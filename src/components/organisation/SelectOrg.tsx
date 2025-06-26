import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle, Loader2 } from 'lucide-react';
import { useOrganizationManager, type OrganizationWithMetadata } from '@/hooks/useOrganizationManager';
import { toast } from 'sonner';

interface SelectOrgProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function SelectOrg({ isOpen = true, onClose, onSuccess }: SelectOrgProps) {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [isSettingActive, setIsSettingActive] = useState(false);
  
  const { getOrganizationsWithMetadata, setActiveOrganization } = useOrganizationManager();

  const { data: organizations, isLoading, refetch } = useQuery({
    queryKey: ['organizations-with-metadata'],
    queryFn: getOrganizationsWithMetadata,
    enabled: isOpen !== false, // Enable if isOpen is not explicitly false
    staleTime: 30000 // 30 seconds
  });

  const handleSetActive = async (orgId: string) => {
    setIsSettingActive(true);
    setSelectedOrgId(orgId);
    
    try {
      await setActiveOrganization(orgId);
      onSuccess?.();
      onClose?.();
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setIsSettingActive(false);
      setSelectedOrgId('');
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Select an organization to make it active for posting jobs and managing candidates.
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading organizations...</p>
        </div>
      ) : organizations && organizations.length > 0 ? (
        <div className="space-y-3">
          {organizations.map((org) => (
            <Card 
              key={org.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedOrgId === org.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => !isSettingActive && handleSetActive(org.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                      {org.logo ? (
                        <img src={org.logo} alt={org.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <Building2 className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{org.name}</h3>
                        {org.isActive && <Badge variant="default">Active</Badge>}
                      </div>
                      {org.contactEmail && (
                        <p className="text-sm text-muted-foreground">{org.contactEmail}</p>
                      )}
                      {org.contactPersonName && (
                        <p className="text-sm text-muted-foreground">Contact: {org.contactPersonName}</p>
                      )}
                      {org.address && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{org.address}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          ID: {org.slug}
                        </Badge>
                        {org.gstNumber && (
                          <Badge variant="outline" className="text-xs">
                            GST: {org.gstNumber}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {isSettingActive && selectedOrgId === org.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : org.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Button size="sm" onClick={(e) => {
                        e.stopPropagation();
                        handleSetActive(org.id);
                      }}>
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium mb-2">No Organizations Found</h3>
          <p className="text-muted-foreground mb-4">
            You haven't created any organizations yet.
          </p>
          <Button onClick={onClose}>
            Create Your First Organization
          </Button>
        </div>
      )}

      <div className="flex justify-end">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  );

  // If dialog props are provided, wrap in dialog
  if (isOpen !== undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Organization</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // Return standalone component
  return content;
}
