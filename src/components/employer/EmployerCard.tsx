import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Edit, Globe, Phone, Mail, Crown } from 'lucide-react';
// TODO: Move this interface to a separate employer types file when implementing employer store
interface EmployerProfile {
  id: string;
  name: string;
  address: string;
  gstNumber: string;
  logo?: string;
  contactPersonName: string;
  contactEmail?: string;
  contactPhone: string;
  website?: string;
  description: string;
  createdAt: string;
  isActive: boolean;
  isDefault?: boolean;
}

interface EmployerCardProps {
  employer: EmployerProfile;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  isDefault?: boolean;
}

const EmployerCard: React.FC<EmployerCardProps> = ({
  employer,
  isSelected,
  onSelect,
  onEdit,
  isDefault = false
}) => {
  return (
    <Card 
      className={`cursor-pointer transition-shadow hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{employer.name}</CardTitle>
                {isDefault && <Crown className="h-4 w-4 text-amber-500" />}
              </div>
              <p className="text-sm text-muted-foreground">{employer.contactPersonName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSelected && <Badge variant="default">Selected</Badge>}
            {isDefault && <Badge variant="secondary">Default</Badge>}
            <Badge variant={employer.isActive ? 'default' : 'secondary'}>
              {employer.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm text-muted-foreground">
          {employer.contactEmail && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {employer.contactEmail}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {employer.contactPhone}
          </div>
          {employer.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <a href={employer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {employer.website}
              </a>
            </div>
          )}
        </div>

        {employer.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {employer.description}
          </p>
        )}

        <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployerCard; 