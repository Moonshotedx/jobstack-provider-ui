import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2, Scissors, Users, Monitor, Wrench, MoreHorizontal } from 'lucide-react';
import { getRolesGroupedBySectors, getOrphanedRoles, type JobRoleName } from '@/lib/role-schema-loader';
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

interface SectorConfig {
  description: string;
  icon: string;
  roles: string[];
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
  const [sectorsWithRoles, setSectorsWithRoles] = useState<Record<string, SectorConfig>>({});
  const [orphanedRoles, setOrphanedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load available roles when component mounts
  useEffect(() => {
    const loadRoles = async () => {
      if (!isOpen) return;
      
      try {
        setLoading(true);
        setError(null);
        const [sectors, orphaned] = await Promise.all([
          getRolesGroupedBySectors(),
          getOrphanedRoles()
        ]);
        setSectorsWithRoles(sectors);
        setOrphanedRoles(orphaned);
      } catch (err) {
        console.error('Failed to load available roles:', err);
        setError('Failed to load job roles. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, [isOpen]);

  // Filter sectors and roles based on search query
  const getFilteredSectors = () => {
    if (!searchQuery) return sectorsWithRoles;
    
    const filtered: Record<string, SectorConfig> = {};
    
    Object.entries(sectorsWithRoles).forEach(([sectorName, sectorConfig]) => {
      const filteredRoles = sectorConfig.roles.filter((role) =>
        role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sectorName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (filteredRoles.length > 0) {
        filtered[sectorName] = {
          ...sectorConfig,
          roles: filteredRoles
        };
      }
    });
    
    return filtered;
  };

  // Filter orphaned roles based on search query
  const getFilteredOrphanedRoles = () => {
    if (!searchQuery) return orphanedRoles;
    
    return orphanedRoles.filter((role) =>
      role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredSectors = getFilteredSectors();
  const filteredOrphanedRoles = getFilteredOrphanedRoles();

  // Get icon component based on icon name
  const getSectorIcon = (iconName: string) => {
    switch (iconName) {
      case 'scissors':
        return <Scissors className="h-5 w-5" />;
      case 'users':
        return <Users className="h-5 w-5" />;
      case 'monitor':
        return <Monitor className="h-5 w-5" />;
      case 'wrench':
        return <Wrench className="h-5 w-5" />;
      case 'heart':
        return <div className="h-5 w-5 flex items-center justify-center text-red-500">❤</div>;
      case 'truck':
        return <div className="h-5 w-5 flex items-center justify-center text-blue-500">🚛</div>;
      case 'building':
        return <div className="h-5 w-5 flex items-center justify-center text-gray-500">🏢</div>;
      case 'car':
        return <div className="h-5 w-5 flex items-center justify-center text-green-500">🚗</div>;
      case 'graduation-cap':
        return <div className="h-5 w-5 flex items-center justify-center text-purple-500">🎓</div>;
      case 'shopping-bag':
        return <div className="h-5 w-5 flex items-center justify-center text-orange-500">🛍️</div>;
      default:
        return <Wrench className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('posting.selectJobRole')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('posting.roleSelectionSubtitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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

                  {/* Sectors and Roles */}
                  <div className="space-y-6">
                    {Object.entries(filteredSectors).map(([sectorName, sectorConfig]) => (
                      <div key={sectorName} className="space-y-3">
                        {/* Sector Header */}
                        <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            {getSectorIcon(sectorConfig.icon)}
                            <span>{sectorName}</span>
                          </div>
                          <span className="text-sm text-gray-500">{sectorConfig.description}</span>
                        </div>
                        
                        {/* Roles Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-4">
                          {sectorConfig.roles.map((role) => (
                            <Button
                              key={role}
                              variant={selectedJobRole === role ? "default" : "outline"}
                              onClick={() => onRoleSelection(role)}
                              className="h-auto p-4 text-left justify-start min-h-[3rem]"
                            >
                              <span className="text-sm font-medium whitespace-normal break-words">{role}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Orphaned Roles Section */}
                    {filteredOrphanedRoles.length > 0 && (
                      <div className="space-y-3">
                        {/* Other Roles Header */}
                        <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <MoreHorizontal className="h-5 w-5" />
                            <span>Other Roles</span>
                          </div>
                          <span className="text-sm text-gray-500">Additional job roles</span>
                        </div>
                        
                        {/* Orphaned Roles Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-4">
                          {filteredOrphanedRoles.map((role) => (
                            <Button
                              key={role}
                              variant={selectedJobRole === role ? "default" : "outline"}
                              onClick={() => onRoleSelection(role)}
                              className="h-auto p-4 text-left justify-start min-h-[3rem]"
                            >
                              <span className="text-sm font-medium whitespace-normal break-words">{role}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Show message if no sectors/roles found */}
                  {Object.keys(filteredSectors).length === 0 && filteredOrphanedRoles.length === 0 && !loading && (
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