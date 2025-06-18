import { useState } from 'react';
import { Search, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const HeroSection = () => {
  const [searchLocation, setSearchLocation] = useState('');
  const [searchRole, setSearchRole] = useState('');

  const jobRoles = [
    'Electrician',
    'Plumber',
    'Carpenter',
    'Welder',
    'Driver',
    'Security Guard',
    'Tailor',
    'Mason',
    'Painter',
    'Machine Operator',
    'Factory Worker',
    'Sales Representative',
  ];

  const locations = [
    'Mumbai',
    'Delhi',
    'Bangalore',
    'Chennai',
    'Hyderabad',
    'Kolkata',
    'Pune',
    'Ahmedabad',
    'Surat',
    'Jaipur',
    'Lucknow',
    'Kanpur',
  ];

  return (
    <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          Find Your Perfect{' '}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Job Match
          </span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Discover opportunities across India with AI-powered matching, verified credentials, 
          and support in your local language
        </p>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Select value={searchLocation} onValueChange={setSearchLocation}>
                <SelectTrigger className="pl-10 h-12">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Briefcase className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Select value={searchRole} onValueChange={setSearchRole}>
                <SelectTrigger className="pl-10 h-12">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {jobRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Search className="h-5 w-5 mr-2" />
              Find Jobs
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">50K+</div>
            <div className="text-muted-foreground">Active Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">100K+</div>
            <div className="text-muted-foreground">Job Seekers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">5K+</div>
            <div className="text-muted-foreground">Companies</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">15</div>
            <div className="text-muted-foreground">Languages</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 