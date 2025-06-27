import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useUserStore } from '@/stores/authStore';
import { toast } from 'sonner';
import EmployerCard from './EmployerCard';
import EmployerProfileDialog from './EmployerProfileDialog';

// TODO: Move this interface to a separate employer types file when implementing employer store
interface EmployerProfile {
  id: string;
  name: string;
  address: string;
  gstNumber: string;
  logo?: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  description: string;
  createdAt: string;
  isActive: boolean;
  isDefault?: boolean;
}

const EmployerManagement = () => {
  const { user } = useUserStore();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState<EmployerProfile | null>(null);
  
  // Create employer list with user's organization as default + additional mock employers
  const allEmployers = useMemo(() => {
    const employers: EmployerProfile[] = [];
    
    // Add user's organization as the primary/default employer
    if (user?.profile && 'contactEmail' in user.profile) {
      const userOrg: EmployerProfile = {
        id: 'user-org',
        name: user.profile.name,
        address: user.profile.address,
        gstNumber: user.profile.gstNumber || '',
        contactPersonName: user.profile.contactPersonName,
        contactEmail: user.profile.contactEmail,
        contactPhone: user.profile.contactPhone,
        website: user.profile.website || '',
        description: user.profile.description || '',
        createdAt: new Date().toISOString().split('T')[0],
        isActive: true,
        isDefault: true
      };
      employers.push(userOrg);
    }
    
    // Add additional mock employers for demonstration
    // employers.push(
    //   {
    //     id: 'emp-2',
    //     name: 'Innovation Labs',
    //     address: '456 Tech Hub, Bangalore, Karnataka 560001',
    //     gstNumber: '29XYZAB5678C1Z9',
    //     contactPersonName: 'Priya Sharma',
    //     contactEmail: 'priya@innovationlabs.com',
    //     contactPhone: '+91 87654 32109',
    //     website: 'https://innovationlabs.com',
    //     description: 'Cutting-edge research and development in AI and machine learning technologies.',
    //     createdAt: '2024-02-01',
    //     isActive: true,
    //     isDefault: false
    //   }
    // );
    
    return employers;
  }, [user?.profile]);

  // Default to user's organization if available, otherwise first employer
  const defaultEmployerId = allEmployers.find(emp => emp.isDefault)?.id || allEmployers[0]?.id || '';
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

  const handleDeleteEmployer = (employerId: string) => {
    // Find the employer to check if it's default
    const employer = allEmployers.find(emp => emp.id === employerId);
    
    // Prevent deletion of default employer (user's organization)
    if (employer?.isDefault) {
      toast.error('Cannot delete your organization profile. This represents your primary business.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this employer profile?')) {
      toast.success("Employer profile deleted successfully!");
      // TODO: Implement actual deletion when employer store is ready
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingEmployer(null);
  };

  if (!user) return null;

  // Sort employers to show default employer first
  const sortedEmployers = [...allEmployers].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

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

      <EmployerProfileDialog
        isOpen={showAddDialog || !!editingEmployer}
        onClose={handleCloseDialog}
        employer={editingEmployer || undefined}
      />
    </div>
  );
};

export default EmployerManagement; 