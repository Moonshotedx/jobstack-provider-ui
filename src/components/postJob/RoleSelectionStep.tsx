import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { JOB_ROLES_BY_INDUSTRY } from '@/constants/jobRoles';

interface RoleSelectionStepProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobRole: string;
  selectedIndustry: string;
  onRoleSelection: (role: string, industry: string) => void;
  onProceed: () => void;
  onBack: () => void;
  skipAuthSteps: boolean;
}

const RoleSelectionStep: React.FC<RoleSelectionStepProps> = ({
  isOpen,
  onClose,
  selectedJobRole,
  onRoleSelection,
  onProceed,
  onBack,
  skipAuthSteps
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Get all roles from all industries in a flat array
  const getAllRoles = () => {
    const allRoles: { role: string; industry: string }[] = [];
    Object.entries(JOB_ROLES_BY_INDUSTRY).forEach(([industry, roles]) => {
      roles.forEach(role => {
        allRoles.push({ role, industry });
      });
    });
    return allRoles;
  };

  // Filter roles based on search query
  const getFilteredRoles = () => {
    const allRoles = getAllRoles();
    if (!searchQuery) return allRoles;
    
    return allRoles.filter(({ role }) =>
      role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredRoles = getFilteredRoles();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Job Role</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Choose the specific role you want to hire for</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search job roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* All Job Roles in a Single Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredRoles.map(({ role, industry }) => (
                  <Button
                    key={role}
                    variant={selectedJobRole === role ? "default" : "outline"}
                    onClick={() => onRoleSelection(role, industry)}
                    className="h-auto p-4 text-left justify-start"
                  >
                    <span className="text-sm font-medium">{role}</span>
                  </Button>
                ))}
              </div>

              {/* Show message if no roles found */}
              {filteredRoles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No job roles found matching your search.</p>
                </div>
              )}

              {/* Selected Role Display */}
              {selectedJobRole && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-blue-900">Selected Role: {selectedJobRole}</p>
                    </div>
                    <Button onClick={onProceed}>
                      Continue to Job Details
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            {!skipAuthSteps && (
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionStep; 