import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuthStore, type EmployerProfile } from '@/stores/authStore';
import EmployerCard from './EmployerCard';
import EmployerProfileDialog from './EmployerProfileDialog';

interface EmployerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmployerManagementModal: React.FC<EmployerManagementModalProps> = ({ isOpen, onClose }) => {
  const { user, selectEmployer, deleteEmployer, getSelectedEmployer } = useAuthStore();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState<EmployerProfile | null>(null);
  const selectedEmployer = getSelectedEmployer();

  const handleSelectEmployer = (employerId: string) => {
    selectEmployer(employerId);
  };

  const handleEditEmployer = (employer: EmployerProfile) => {
    setEditingEmployer(employer);
  };

  const handleDeleteEmployer = (employerId: string) => {
    // Find the employer to check if it's default
    const employer = user?.managedEmployers.find(emp => emp.id === employerId);
    
    // Prevent deletion of default employer
    if (employer?.isDefault) {
      alert('Cannot delete the default employer profile. This represents your organization.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this employer profile?')) {
      deleteEmployer(employerId);
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingEmployer(null);
  };

  if (!user) return null;

  // Sort employers to show default employer first
  const sortedEmployers = [...user.managedEmployers].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

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
                Manage employer profiles and switch between different companies
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employer
              </Button>
            </div>

            {sortedEmployers.length === 0 ? (
              <div className="text-center py-12">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">No Employers Added</h3>
                  <p className="text-muted-foreground">
                    Add your first employer profile to start posting jobs and managing candidates
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Employer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedEmployers.map((employer) => (
                  <EmployerCard
                    key={employer.id}
                    employer={employer}
                    isSelected={selectedEmployer?.id === employer.id}
                    onSelect={() => handleSelectEmployer(employer.id)}
                    onEdit={() => handleEditEmployer(employer)}
                    onDelete={() => handleDeleteEmployer(employer.id)}
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