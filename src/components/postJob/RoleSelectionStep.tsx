import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { getAvailableRoles, type JobRoleName } from '@/lib/role-schema-loader';
import { useTranslation } from 'react-i18next';

interface RoleSelectionStepProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobRole: JobRoleName | null;
  onRoleSelection: (role: JobRoleName) => void;
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
  const { t } = useTranslation('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load available roles when component mounts
  useEffect(() => {
    const loadRoles = async () => {
      if (!isOpen) return;
      
      try {
        setLoading(true);
        setError(null);
        const roles = await getAvailableRoles();
        setAvailableRoles(roles);
      } catch (err) {
        console.error('Failed to load available roles:', err);
        setError('Failed to load job roles. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, [isOpen]);

  // Filter roles based on search query
  const getFilteredRoles = () => {
    if (!searchQuery) return availableRoles;
    
    return availableRoles.filter((role) =>
      role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredRoles = getFilteredRoles();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('posting.selectJobRole')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('posting.roleSelectionSubtitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading job roles...</span>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-destructive font-medium">{error}</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {!loading && !error && (
                <>
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder={t('posting.searchJobRoles')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* All Job Roles in a Single Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredRoles.map((role) => (
                      <Button
                        key={role}
                        variant={selectedJobRole === role ? "default" : "outline"}
                        onClick={() => onRoleSelection(role)}
                        className="h-auto p-4 text-left justify-start"
                      >
                        <span className="text-sm font-medium">{role}</span>
                      </Button>
                    ))}
                  </div>

                  {/* Show message if no roles found */}
                  {filteredRoles.length === 0 && !loading && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>{t('posting.noRolesFound')}</p>
                    </div>
                  )}

                  {/* Selected Role Display */}
                  {selectedJobRole && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-blue-900">{t('posting.selectedRole', { role: selectedJobRole })}</p>
                        </div>
                        <Button onClick={onProceed}>
                          {t('posting.continueToJobDetails')}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            {!skipAuthSteps && (
              <Button variant="outline" onClick={onBack}>
                {t('posting.back')}
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              {t('posting.cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionStep; 