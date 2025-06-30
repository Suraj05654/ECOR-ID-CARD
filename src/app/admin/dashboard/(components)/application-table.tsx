'use client';

import type { StoredEmployee } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye, Filter, Search as SearchIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChangeEvent} from 'react';
import { useState, useMemo }from 'react';
import ApplicationActions from './application-actions';
import { Application } from '@/lib/new_admin_backend/types';

interface ApplicationTableProps {
  applications: StoredEmployee[];
}

const applicationStatusOptions: StoredEmployee['status'][] = ["Pending", "Approved", "Rejected", "Closed"];
const applicantTypeOptions = ["gazetted", "non-gazetted"]; // Assuming these are the types for StoredApplication

export function ApplicationTable({ applications: initialApplications }: ApplicationTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredApplications = useMemo(() => {
    return initialApplications.filter(app => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (app.employeeName || '').toLowerCase().includes(searchLower) ||
                          (app.employeeNo || '').toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchesType = typeFilter === 'all' || app.applicantType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [initialApplications, searchTerm, statusFilter, typeFilter]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const getStatusVariant = (status: StoredEmployee['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Approved':
      case 'Closed':
        return 'default'; 
      case 'Pending':
        return 'secondary'; 
      case 'Rejected':
        return 'destructive';
      default:
        return 'outline'; 
    }
  };

  // Generate a unique key for each row
  const getRowKey = (app: StoredEmployee): string => {
    // Try to use Appwrite's $id first
    if (app.$id) return app.$id;
    
    // If no $id, create a composite key from multiple fields
    const keyParts = [
      app.employeeNo,
      app.employeeName,
      app.applicationDate instanceof Date ? app.applicationDate.toISOString() : app.applicationDate,
      app.status
    ].filter(Boolean); // Remove any undefined/null values
    
    return keyParts.join('_') || Math.random().toString(36).substr(2, 9); // Fallback to random if all else fails
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row gap-4 items-center p-4 border rounded-lg bg-card shadow">
        <div className="relative w-full md:flex-grow">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by Name, Employee ID, App ID..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {applicationStatusOptions.map(status => (
                <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
           <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {applicantTypeOptions.map(type => (
                <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Filter className="mx-auto h-12 w-12 mb-4" />
          <p className="text-xl font-semibold">No applications found.</p>
          <p>Try adjusting your search or filter criteria, or check if new applications have been submitted.</p>
        </div>
      ) : (
      <div className="border rounded-lg overflow-hidden shadow bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/60">
              <TableHead>Application ID</TableHead>
              <TableHead>Applicant Name</TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.map((app) => {
              const rowKey = getRowKey(app);
              return (
                <TableRow key={rowKey} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium">{app.$id || app.employeeNo}</TableCell>
                  <TableCell>{app.employeeName}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">ID: {app.employeeNo || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">RUID: {app.ruidNo || 'N/A'}</div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{app.applicantType}</TableCell>
                  <TableCell>{app.applicationDate ? format(new Date(app.applicationDate), 'dd MMM yyyy, p') : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(app.status)} className="capitalize text-xs">
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button variant="outline" size="sm" asChild className="group">
                        <Link href={`/admin/dashboard/applications/${app.$id || app.employeeNo}`}> 
                          <Eye className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" /> View
                        </Link>
                      </Button>
                      <ApplicationActions
                        applicationId={app.$id}
                        currentStatus={(app.status?.toLowerCase() === 'approved' ? 'approved' : 
                                        app.status?.toLowerCase() === 'rejected' ? 'rejected' : 'pending') as Application['status']}
                        application={{
                          id: app.$id,
                          name: app.employeeName || '',
                          designation: app.designation || '',
                          dateOfBirth: app.dateOfBirth?.toString() || '',
                          station: app.station || '',
                          department: app.department || '',
                          pfNumber: app.employeeNo || '',
                          mobile: app.mobileNumber || app.rlyContactNumber || '',
                          status: (app.status?.toLowerCase() === 'approved' ? 'approved' : 
                                  app.status?.toLowerCase() === 'rejected' ? 'rejected' : 'pending') as Application['status'],
                          rejectionRemarks: app.remark,
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  );
}
