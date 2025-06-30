'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getEmployeesService } from '@/lib/new_admin_backend/services';
import { useRouter } from 'next/navigation';
import { Loader2, Users, UserCheck, UserX, ArrowRight, RefreshCw, Plus, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RailwayIdCardDynamic } from '@/components/railway-id-card-dynamic';

type EmployeeStats = {
  total: number;
  active: number;
  inactive: number;
  recentHires: number;
};

type StatCardProps = {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  color?: 'primary' | 'success' | 'destructive' | 'warning';
};

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon,
  color = 'primary' 
}: StatCardProps) => {
  const colorMap = {
    primary: 'text-blue-600 bg-blue-100',
    success: 'text-green-600 bg-green-100',
    destructive: 'text-red-600 bg-red-100',
    warning: 'text-amber-600 bg-amber-100',
  };

  const iconMap = {
    primary: 'text-blue-600',
    success: 'text-green-600',
    destructive: 'text-red-600',
    warning: 'text-amber-600',
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <div className={`p-2 rounded-full ${colorMap[color]}`}>
          <Icon className={`h-4 w-4 ${iconMap[color]}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState<EmployeeStats>({
    total: 0,
    active: 0,
    inactive: 0,
    recentHires: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);
      
      const { employees } = await getEmployeesService({}, 0, 1000);
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeEmployees = employees.filter(emp => emp.status?.toLowerCase() === 'active');
      const recentHires = employees.filter(emp => {
        const hireDate = new Date(emp.createdAt || emp.$createdAt);
        return hireDate >= thirtyDaysAgo;
      });
      
      setStats({
        total: employees.length,
        active: activeEmployees.length,
        inactive: employees.length - activeEmployees.length,
        recentHires: recentHires.length,
      });
      
      if (isRefresh) {
        toast({
          title: 'Success',
          description: 'Dashboard data refreshed',
        });
      }
    } catch (err) {
      console.error('Error fetching employee data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load employee data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData(true);
  };

  if (isLoading && !isRefreshing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your employee management
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button 
            onClick={() => router.push('/admin/employees')}
            className="gap-2"
          >
            View All Employees
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={stats.total}
          description="Total number of employees"
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Active Employees"
          value={stats.active}
          description="Currently active"
          icon={UserCheck}
          color="success"
        />
        <StatCard
          title="Inactive Employees"
          value={stats.inactive}
          description="Inactive or on leave"
          icon={UserX}
          color="destructive"
        />
        <StatCard
          title="Recent Hires"
          value={stats.recentHires}
          description="Hired in last 30 days"
          icon={Users}
          color="warning"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button 
              variant="outline" 
              className="justify-start gap-2"
              onClick={() => router.push('/admin/employees/new')}
            >
              <Plus className="h-4 w-4" />
              Add New Employee
            </Button>
            <Button 
              variant="outline" 
              className="justify-start gap-2"
              onClick={() => router.push('/admin/reports')}
            >
              <FileText className="h-4 w-4" />
              Generate Reports
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in your system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="h-2 w-2 mt-2 rounded-full bg-blue-500"></div>
                <div className="ml-3 space-y-1">
                  <p className="text-sm font-medium">System updated</p>
                  <p className="text-xs text-muted-foreground">
                    Version 1.2.0 released with new features
                  </p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="h-2 w-2 mt-2 rounded-full bg-green-500"></div>
                <div className="ml-3 space-y-1">
                  <p className="text-sm font-medium">New employee added</p>
                  <p className="text-xs text-muted-foreground">
                    John Doe joined the team
                  </p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
