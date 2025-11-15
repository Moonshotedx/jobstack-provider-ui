import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Loader2 } from 'lucide-react';
import type { Organization } from '@/lib/api-client';

interface LoginOrgSelectionProps {
  isOpen: boolean;
  organizations: Organization[];
  onSelect: (orgId: string) => Promise<void>;
}

export function LoginOrgSelection({ isOpen, organizations, onSelect }: LoginOrgSelectionProps) {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelect = async (orgId: string) => {
    setIsSelecting(true);
    setSelectedOrgId(orgId);
    
    try {
      await onSelect(orgId);
    } catch (error) {
      setIsSelecting(false);
      setSelectedOrgId('');
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Organization</DialogTitle>
          <p className="text-sm text-muted-foreground">
            You have multiple organizations. Please select one to continue.
          </p>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {organizations.map((org) => (
            <Card 
              key={org.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedOrgId === org.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => !isSelecting && handleSelect(org.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                      {org.logo ? (
                        <img src={org.logo} alt={org.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <Building2 className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{org.name}</h3>
                        {org.type === 'association' && (
                          <Badge variant="default" className="bg-purple-600">Association</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">ID: {org.slug}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {isSelecting && selectedOrgId === org.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(org.id);
                        }}
                        disabled={isSelecting}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

