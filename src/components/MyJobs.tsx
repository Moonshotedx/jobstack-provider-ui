import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MyJobs = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your job postings will appear here. This is a placeholder component.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyJobs; 