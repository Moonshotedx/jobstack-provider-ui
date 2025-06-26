import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateOrg } from './CreateOrg';
import { SelectOrg } from './SelectOrg';
import { Plus, Building2 } from 'lucide-react';

/**
 * Demo component showing how to use the enhanced organization components
 * This component demonstrates:
 * 1. Creating organizations with better-auth integration
 * 2. Selecting/switching between organizations
 * 3. Automatic slug generation from GST number or crypto ID
 * 4. Metadata storage for extended organization fields
 */
export function OrganizationDemo() {
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showSelectOrg, setShowSelectOrg] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Organization Management Demo</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This demo shows the enhanced organization management components with better-auth integration,
            automatic slug generation, and extended metadata support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Organization Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create a new organization with comprehensive details. Features include:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Auto-generated slugs from GST number or crypto ID</li>
                <li>• Better-auth integration for core organization data</li>
                <li>• Extended metadata storage for additional fields</li>
                <li>• Automatic user profile updates</li>
                <li>• Organization logo upload support</li>
              </ul>
              <Button 
                onClick={() => setShowCreateOrg(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Organization
              </Button>
            </CardContent>
          </Card>

          {/* Select Organization Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Select Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Switch between your organizations. Features include:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Visual organization cards with metadata</li>
                <li>• Automatic active organization switching</li>
                <li>• Profile updates when switching organizations</li>
                <li>• Organization logo and details display</li>
                <li>• GST number and contact information</li>
              </ul>
              <Button 
                onClick={() => setShowSelectOrg(true)}
                variant="outline"
                className="w-full"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Select Organization
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Implementation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Slug Generation Logic:</h4>
              <code className="block text-sm bg-muted p-2 rounded">
                {`// If GST number provided: clean and use as slug
// If no GST number: generate crypto-based unique ID
const generateSlug = (gstNumber?: string): string => {
  if (gstNumber && gstNumber.trim().length > 0) {
    return gstNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }
  return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
};`}
              </code>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Metadata Storage:</h4>
              <p className="text-sm text-muted-foreground">
                Extended organization fields (address, contact details, etc.) are stored separately 
                and automatically synced when switching organizations. This hybrid approach allows 
                better-auth to handle core organization management while supporting additional fields.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Usage in Your App:</h4>
              <code className="block text-sm bg-muted p-2 rounded">
                {`import { CreateOrg } from '@/components/organisation/CreateOrg';
import { SelectOrg } from '@/components/organisation/SelectOrg';

// As dialogs
<CreateOrg isOpen={show} onClose={close} onSuccess={handleSuccess} />
<SelectOrg isOpen={show} onClose={close} onSuccess={handleSuccess} />

// As standalone components
<CreateOrg />
<SelectOrg />`}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateOrg
        isOpen={showCreateOrg}
        onClose={() => setShowCreateOrg(false)}
        onSuccess={() => {
          setShowCreateOrg(false);
          // Optionally refresh organization list or update state
        }}
      />

      <SelectOrg
        isOpen={showSelectOrg}
        onClose={() => setShowSelectOrg(false)}
        onSuccess={() => {
          setShowSelectOrg(false);
          // Organization has been switched successfully
        }}
      />
    </div>
  );
} 