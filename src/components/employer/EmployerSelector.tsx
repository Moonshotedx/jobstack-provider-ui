import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Building2, Plus } from 'lucide-react';
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">
              {selectedEmployer ? selectedEmployer.name : 'Select Employer'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        {user.managedEmployers.map((employer) => (
          <DropdownMenuItem
            key={employer.id}
            onClick={() => selectEmployer(employer.id)}
            className={selectedEmployer?.id === employer.id ? 'bg-accent' : ''}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{employer.name}</span>
              <span className="text-xs text-muted-foreground">{employer.contactEmail}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={onAddEmployer} className="border-t">
          <Plus className="h-4 w-4 mr-2" />
          Add New Employer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EmployerSelector; 