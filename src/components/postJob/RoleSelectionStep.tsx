import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  selectedIndustry,
  onRoleSelection,
  onProceed,
  onBack,
  skipAuthSteps
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getFilteredRoles = () => {
    if (!searchQuery) return JOB_ROLES_BY_INDUSTRY;
    
    const filtered: Partial<typeof JOB_ROLES_BY_INDUSTRY> = {};
    Object.entries(JOB_ROLES_BY_INDUSTRY).forEach(([industry, roles]) => {
      const matchingRoles = roles.filter(role =>
        role.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingRoles.length > 0) {
        filtered[industry as keyof typeof JOB_ROLES_BY_INDUSTRY] = matchingRoles;
      }
    });
    return filtered;
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

              {/* Industry Tabs */}
              <Tabs defaultValue={Object.keys(filteredRoles)[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
                  {Object.keys(filteredRoles).map(industry => (
                    <TabsTrigger key={industry} value={industry} className="text-xs px-2">
                      {industry.split(' ')[0]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {Object.entries(filteredRoles).map(([industry, roles]) => (
                  <TabsContent key={industry} value={industry} className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {roles.map(role => (
                        <Button
                          key={role}
                          variant={selectedJobRole === role ? "default" : "outline"}
                          onClick={() => onRoleSelection(role, industry)}
                          className="h-auto p-3 text-left justify-start"
                        >
                          <span className="text-sm">{role}</span>
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Selected Role Display */}
              {selectedJobRole && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-blue-900">Selected Role: {selectedJobRole}</p>
                      <p className="text-sm text-blue-700">Industry: {selectedIndustry}</p>
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