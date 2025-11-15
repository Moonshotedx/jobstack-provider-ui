import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/authStore';
import { toast } from 'sonner';
import EmployerCard from './EmployerCard';
import EmployerProfileDialog from './EmployerProfileDialog';
import { useGetOrganizationList } from '@/hooks/useJobsApi';
import type { Organization } from '@/lib/api-client';

// TODO: Move this interface to a separate employer types file when implementing employer store
interface EmployerProfile {
  id: string;
  name: string;
  address: string;
  gstNumber?: string; // Made optional since it's removed from UI
  logo?: string;
  contactPersonName: string;
  contactEmail?: string;
  contactPhone: string;
  website?: string;
  description: string;
  associationslug?: string;
  createdAt: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface EmployerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmployerManagementModal: React.FC<EmployerManagementModalProps> = ({ isOpen, onClose }) => {
  const { user } = useUserStore();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState<EmployerProfile | null>(null);
  
  // Fetch organizations from API
  const { data: organizations, isLoading, error } = useGetOrganizationList();
  
  // Transform API organizations to EmployerProfile format
  const allEmployers = useMemo(() => {
    if (!organizations) return [];
    
    return organizations.map((org: Organization) => {
      let metadata: any = {};
      try {
        metadata = JSON.parse(org.metadata || '{}');
      } catch (e) {
        console.warn('Failed to parse organization metadata:', e);
        metadata = {};
      }
      
      // Extract associationslug from organization type field (format: "associationslug:xxx")
      let associationslug = '';
      if (org.type && org.type.startsWith('associationslug:')) {
        associationslug = org.type.replace('associationslug:', '');
      }
      
      return {
        id: org.id,
        name: org.name || '',
        address: metadata?.address || '',
        gstNumber: metadata?.gstNumber || '',
        logo: org.logo,
        contactPersonName: metadata?.contactPersonName || '',
        contactEmail: metadata?.contactEmail || '',
        contactPhone: metadata?.contactPhone || '',
        website: metadata?.website || '',
        description: metadata?.description || '',
        associationslug: associationslug,
        createdAt: org.createdAt,
        isActive: true,
        isDefault: false // We'll determine this based on user's current organization
      };
    });
  }, [organizations]);

  // Default to first employer if available
  const defaultEmployerId = allEmployers[0]?.id || '';
  const [selectedEmployerId, setSelectedEmployerId] = useState<string>(defaultEmployerId);
  
  const selectedEmployer = allEmployers.find(emp => emp.id === selectedEmployerId);

  const handleSelectEmployer = (employerId: string) => {
    setSelectedEmployerId(employerId);
    const employer = allEmployers.find(emp => emp.id === employerId);
    toast.success(`Selected: ${employer?.name}`);
  };

  const handleEditEmployer = (employer: EmployerProfile) => {
    setEditingEmployer(employer);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingEmployer(null);
  };

  if (!user) return null;

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employer Management</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading organizations...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employer Management</DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2 text-red-600">Error Loading Organizations</h3>
            <p className="text-muted-foreground mb-4">
              {error.message || 'Failed to load organizations. Please try again.'}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employer Management</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                Manage employer profile and Edit Organization details
              </p>
            </div>

            {allEmployers.length === 0 ? (
              <div className="text-center py-12">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">No Organizations Found</h3>
                  <p className="text-muted-foreground">
                    No organizations are available. Please create an organization first.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allEmployers.map((employer) => (
                  <EmployerCard
                    key={employer.id}
                    employer={employer}
                    isSelected={selectedEmployer?.id === employer.id}
                    onSelect={() => handleSelectEmployer(employer.id)}
                    onEdit={() => handleEditEmployer(employer)}
                    isDefault={employer.isDefault || false}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <EmployerProfileDialog
        isOpen={showAddDialog || !!editingEmployer}
        onClose={handleCloseDialog}
        employer={editingEmployer || undefined}
      />
    </>
  );
};

export default EmployerManagementModal; 