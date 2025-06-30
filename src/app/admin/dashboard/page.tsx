'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getEmployeesService } from '@/lib/new_admin_backend/services';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ApplicationTable } from './(components)/application-table';
import type { StoredEmployee } from '@/lib/types';

export default function DashboardPage() {
  const [employees, setEmployees] = useState<StoredEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmployees = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const { employees: rawEmployees } = await getEmployeesService({}, 0, 500);
      
      // Transform the data to match StoredEmployee type
      const transformedEmployees = rawEmployees.map((emp: any) => ({
        ...emp,
        // Ensure all required fields are present
        $id: emp.$id,
        $collectionId: emp.$collectionId,
        $databaseId: emp.$databaseId,
        $createdAt: emp.$createdAt,
        $updatedAt: emp.$updatedAt,
        $permissions: emp.$permissions || [],
        // Convert dates
        applicationDate: new Date(emp.applicationDate || emp.$createdAt),
        createdAt: new Date(emp.$createdAt),
        updatedAt: new Date(emp.$updatedAt),
        dateOfBirth: new Date(emp.dateOfBirth || emp.dob || Date.now()),
        // Ensure other required fields have defaults
        status: emp.status || 'Pending',
        employeeName: emp.employeeName || emp.name || 'Unknown',
        employeeNo: emp.employeeNo || emp.id || '',
        familyMembersJson: emp.familyMembersJson || '[]',
        applicantType: emp.applicantType || 'non-gazetted',
      }));

      setEmployees(transformedEmployees);
    } catch (err: any) {
      console.error('Failed to load applications:', err);
      toast.error('Failed to load applications');
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const total = employees.length;
  const pending = employees.filter(e => e.status.toLowerCase() === 'pending').length;
  const approved = employees.filter(e => e.status.toLowerCase() === 'approved').length;
  const rejected = employees.filter(e => e.status.toLowerCase() === 'rejected').length;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent>{total}</CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Pending</CardTitle>
          </CardHeader>
          <CardContent>{pending}</CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Approved</CardTitle>
          </CardHeader>
          <CardContent>{approved}</CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Rejected</CardTitle>
          </CardHeader>
          <CardContent>{rejected}</CardContent>
        </Card>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchEmployees(true)} 
          disabled={refreshing} 
          className="self-start"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ApplicationTable applications={employees} />
    </div>
  );
}
