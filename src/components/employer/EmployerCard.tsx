import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Edit, Trash2, Globe, Phone, Mail } from 'lucide-react';
import type { EmployerProfile } from '@/contexts/AuthContext';

interface EmployerCardProps {
  employer: EmployerProfile;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const EmployerCard: React.FC<EmployerCardProps> = ({
  employer,
  isSelected,
  onSelect,
  onEdit,
  onDelete
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
              <CardTitle className="text-lg">{employer.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{employer.contactPersonName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSelected && <Badge variant="default">Selected</Badge>}
            <Badge variant={employer.isActive ? 'default' : 'secondary'}>
              {employer.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {employer.contactEmail}
          </div>
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
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployerCard; 