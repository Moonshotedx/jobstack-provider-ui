import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuthStore, type EmployerProfile } from '@/stores/authStore';
import EmployerCard from './EmployerCard';
import EmployerProfileDialog from './EmployerProfileDialog';

const EmployerManagement = () => {
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
    if (confirm('Are you sure you want to delete this employer profile?')) {
      deleteEmployer(employerId);
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingEmployer(null);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Employer Management</h2>
          <p className="text-muted-foreground">
            Manage employer profiles and switch between different companies
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employer
        </Button>
      </div>

      {user.managedEmployers.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {user.managedEmployers.map((employer) => (
            <EmployerCard
              key={employer.id}
              employer={employer}
              isSelected={selectedEmployer?.id === employer.id}
              onSelect={() => handleSelectEmployer(employer.id)}
              onEdit={() => handleEditEmployer(employer)}
              onDelete={() => handleDeleteEmployer(employer.id)}
            />
          ))}
        </div>
      )}

      <EmployerProfileDialog
        isOpen={showAddDialog || !!editingEmployer}
        onClose={handleCloseDialog}
        employer={editingEmployer || undefined}
      />
    </div>
  );
};

export default EmployerManagement; 