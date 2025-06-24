import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Building2, Plus, Crown } from 'lucide-react';
import { useUserStore } from '@/stores/authStore';
import { toast } from 'sonner';

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

interface EmployerSelectorProps {
  onAddEmployer: () => void;
}

const EmployerSelector: React.FC<EmployerSelectorProps> = ({ onAddEmployer }) => {
  const { user } = useUserStore();
  
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
    employers.push(
      {
        id: 'emp-2',
        name: 'Innovation Labs',
        address: '456 Tech Hub, Bangalore, Karnataka 560001',
        gstNumber: '29XYZAB5678C1Z9',
        contactPersonName: 'Priya Sharma',
        contactEmail: 'priya@innovationlabs.com',
        contactPhone: '+91 87654 32109',
        website: 'https://innovationlabs.com',
        description: 'Cutting-edge research and development in AI and machine learning technologies.',
        createdAt: '2024-02-01',
        isActive: true,
        isDefault: false
      }
    );
    
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

  if (!user || allEmployers.length === 0) {
    return (
      <Button onClick={onAddEmployer} variant="outline" className="gap-2">
        <Plus className="h-4 w-4" />
        Add Employer
      </Button>
    );
  }

  // Sort employers to show default employer first
  const sortedEmployers = [...allEmployers].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  const isDefaultEmployer = (employerId: string) => {
    return allEmployers.find(emp => emp.id === employerId)?.isDefault || false;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">
              {selectedEmployer ? selectedEmployer.name : 'Select Employer'}
            </span>
            {selectedEmployer && isDefaultEmployer(selectedEmployer.id) && (
              <Crown className="h-3 w-3 text-amber-500" />
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        {sortedEmployers.map((employer) => (
          <DropdownMenuItem
            key={employer.id}
            onClick={() => handleSelectEmployer(employer.id)}
            className={selectedEmployer?.id === employer.id ? 'bg-accent' : ''}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{employer.name}</span>
                  {isDefaultEmployer(employer.id) && (
                    <Crown className="h-3 w-3 text-amber-500" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{employer.contactEmail}</span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddEmployer}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Employer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EmployerSelector; 