import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Building2, Plus, Crown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface EmployerSelectorProps {
  onAddEmployer: () => void;
}

const EmployerSelector: React.FC<EmployerSelectorProps> = ({ onAddEmployer }) => {
  const { user, selectEmployer, getSelectedEmployer } = useAuthStore();
  const selectedEmployer = getSelectedEmployer();

  if (!user || user.managedEmployers.length === 0) {
    return (
      <Button onClick={onAddEmployer} variant="outline" className="gap-2">
        <Plus className="h-4 w-4" />
        Add Employer
      </Button>
    );
  }

  // Sort employers to show default employer first
  const sortedEmployers = [...user.managedEmployers].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  const isDefaultEmployer = (employerId: string) => {
    return user.managedEmployers.find(emp => emp.id === employerId)?.isDefault || false;
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
            onClick={() => selectEmployer(employer.id)}
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