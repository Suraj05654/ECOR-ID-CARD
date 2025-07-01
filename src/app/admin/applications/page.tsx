'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RailwayIdCardDynamic } from '@/components/railway-id-card-dynamic';
import { Check, X, StickyNote, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateApplicationStatus } from '@/lib/actions/application';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from "@/components/ui/label";

// Types
interface FamilyMemberApi {
  name: string;
  relationship: string;
  dob: string;
  bloodGroup: string;
}

interface ApplicationApi {
  id: string;
  empNo: string;
  empName: string;
  designation: string;
  dob: string;
  department: string;
  station: string;
  mobileNumber: string;
  emergencyName: string;
  emergencyPhone: string;
  applicationDate: string;
  photoUrl: string;
  signatureUrl: string;
  qrUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  remark?: string;
  familyMembers: FamilyMemberApi[];
  hindiNameUrl?: string;
  hindiDesignationUrl?: string;
  ruidNo?: string;
  residentialAddress?: string;
  address?: string;
  presentAddress?: string;
  permanentAddress?: string;
}

type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'all';
type ActionType = 'accept' | 'reject';

interface ActionState {
  type: ActionType;
  rec: ApplicationApi;
}

// Constants
const STATUS_OPTIONS: Array<{ value: ApplicationStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

// Helper Components
function StatusBadge({ status }: { status: ApplicationApi['status'] }) {
  const getVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Badge variant={getVariant(status)} className="capitalize">
      {status}
    </Badge>
  );
}

// Utility functions
const transformEmployeeData = (employee: any): ApplicationApi => {
  const qrData = {
    name: employee.employeeName || employee.empName,
    pfNumber: employee.ruidNo || employee.employeeNo || employee.empNo,
    designation: employee.designation,
    dateOfBirth: employee.dateOfBirth || employee.dob,
    station: employee.station,
    department: employee.department
  };

  return {
    id: employee.id || employee.$id,
    empNo: employee.employeeNo || employee.empNo,
    ruidNo: employee.ruidNo,
    empName: employee.employeeName || employee.empName,
    designation: employee.designation,
    dob: employee.dateOfBirth || employee.dob,
    department: employee.department,
    station: employee.station,
    mobileNumber: employee.mobileNumber,
    emergencyName: employee.emergencyContactName,
    emergencyPhone: employee.emergencyContactNumber,
    applicationDate: (employee.applicationDate || employee.$createdAt).split('T')[0],
    photoUrl: employee.photoUrl || (employee.photoFileId ? `/api/file/${employee.photoFileId}` : ''),
    signatureUrl: employee.signatureUrl || (employee.signatureFileId ? `/api/file/${employee.signatureFileId}` : ''),
    hindiNameUrl: employee.hindiNameUrl || (employee.hindiNameFileId ? `/api/file/${employee.hindiNameFileId}` : ''),
    hindiDesignationUrl: employee.hindiDesignationUrl || (employee.hindiDesignationFileId ? `/api/file/${employee.hindiDesignationFileId}` : ''),
    qrUrl: employee.qrFileId ? 
      `/api/file/${employee.qrFileId}` : 
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(qrData))}`,
    status: (employee.status || 'pending').toLowerCase() as ApplicationApi['status'],
    remark: employee.remark,
    familyMembers: employee.familyMembersJson ? JSON.parse(employee.familyMembersJson) : [],
    residentialAddress:
      employee.residentialAddress ||
      employee.residential_address ||
      employee.ResidentialAddress ||
      employee.RESIDENTIALADDRESS ||
      employee['residential address'] ||
      "",
    address: employee.address,
    presentAddress: employee.presentAddress,
    permanentAddress: employee.permanentAddress
  };
};

export default function ApplicationsPage() {
  // State
  const [applications, setApplications] = useState<ApplicationApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ApplicationApi | null>(null);
  const [action, setAction] = useState<ActionState | null>(null);
  const [remark, setRemark] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>('pending');
  const [error, setError] = useState<string | null>(null);

  // URL params
  const params = useSearchParams();
  const type = params?.get('type');
  
  // Computed values
  const title = useMemo(() => 
    type === 'ng' ? 'Non-Gazetted Applications' : 'Gazetted Applications',
    [type]
  );

  const statusDisplayName = useMemo(() => {
    const option = STATUS_OPTIONS.find(opt => opt.value === selectedStatus);
    return option?.label || 'Applications';
  }, [selectedStatus]);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const applicantType = type === 'ng' ? 'non-gazetted' : type === 'gaz' ? 'gazetted' : '';
      const params = new URLSearchParams();
      
      if (applicantType) params.set('applicantType', applicantType);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      
      const response = await fetch(`/api/employees?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.statusText}`);
      }
      
      const { employees } = await response.json();
      console.log("RAW EMPLOYEE DATA:", employees[0]);
      const transformedApplications = employees.map(transformEmployeeData);
      
      setApplications(transformedApplications);
    } catch (error) {
      console.error('[FETCH_APPLICATIONS] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load applications';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [type, selectedStatus]);

  // Update application status
  const handleStatusUpdate = useCallback(async (application: ApplicationApi, actionType: ActionType) => {
    if (actionType === 'reject' && !remark.trim()) {
      toast.error('Please provide rejection remarks');
      return;
    }

    try {
      const newStatus = actionType === 'accept' ? 'approved' : 'rejected';
      const updateRemark = actionType === 'reject' ? remark : undefined;

      console.log(`[UPDATE_STATUS] Updating application:`, {
        id: application.id,
        type: actionType,
        currentStatus: application.status,
        newStatus,
        name: application.empName
      });

      const result = await updateApplicationStatus(application.id, newStatus, updateRemark);
      
      if (!result.success) {
        console.error(`[UPDATE_STATUS] Failed:`, result.message);
        toast.error(result.message || 'Failed to update status');
        return;
      }

      toast.success(`${actionType === 'accept' ? 'Approved' : 'Rejected'} ${application.empName}`);
      
      // Reset action state and refresh data
      setAction(null);
      setRemark('');
      await fetchApplications();
      
      console.log(`[UPDATE_STATUS] Successfully updated and refreshed data`);
    } catch (error) {
      console.error('[UPDATE_STATUS] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      toast.error(errorMessage);
    }
  }, [remark, fetchApplications]);

  // Reset action dialog
  const resetActionDialog = useCallback(() => {
    setAction(null);
    setRemark('');
  }, []);

  // Show rejection remarks
  const showRejectionRemarks = useCallback((remarks: string) => {
    toast.info(remarks || 'No remarks provided', {
      description: 'Rejection Remarks'
    });
  }, []);

  // Effects
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Render helpers
  const renderActionButtons = useCallback((application: ApplicationApi) => (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPreview(application)}
        title="View Details"
        aria-label={`View details for ${application.empName}`}
      >
        <Eye className="h-4 w-4" />
      </Button>
      
      {application.status === 'pending' && (
        <>
          <Button
            variant="default"
            size="sm"
            onClick={() => setAction({ type: 'accept', rec: application })}
            title="Approve Application"
            aria-label={`Approve application for ${application.empName}`}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setAction({ type: 'reject', rec: application })}
            title="Reject Application"
            aria-label={`Reject application for ${application.empName}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}
      
      {application.status === 'rejected' && application.remark && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => showRejectionRemarks(application.remark!)}
          title="View Rejection Remarks"
          aria-label={`View rejection remarks for ${application.empName}`}
        >
          <StickyNote className="h-4 w-4" />
        </Button>
      )}
    </div>
  ), [showRejectionRemarks]);

  const renderIdCardPreview = useMemo(() => {
    if (!preview) return null;

    const primaryFamilyMember = preview.familyMembers?.[0];
    const emergencyContact = preview.familyMembers?.find(
      member => member.relationship?.toLowerCase() !== 'self'
    );

    const cardAddress = preview.residentialAddress || preview.address || preview.presentAddress || preview.permanentAddress || "N/A";

    return (
      <RailwayIdCardDynamic
        name={preview.empName}
        designation={preview.designation}
        dateOfBirth={preview.dob}
        station={preview.station}
        pfNumber={preview.empNo}
        ruidNo={preview.ruidNo}
        photoUrl={preview.photoUrl}
        signatureUrl={preview.signatureUrl}
        qrUrl={preview.qrUrl}
        address={cardAddress}
        
        bloodGroup={primaryFamilyMember?.bloodGroup || 'N/A'}
        contactNumber={preview.mobileNumber || 'N/A'}
        familyMembers={preview.familyMembers?.map(member => ({
          name: member.name,
          relation: member.relationship,
          dob: member.dob,
          bloodGroup: member.bloodGroup
        })) || []}
        emergencyContact={emergencyContact?.name || preview.empName}
        emergencyPhone={preview.mobileNumber || ''}
        medicalInfo={`Blood Group: ${primaryFamilyMember?.bloodGroup || 'N/A'}`}
      />
    );
  }, [preview]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedStatus} onValueChange={value => setSelectedStatus(value as ApplicationStatus)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchApplications} 
            disabled={loading}
            aria-label="Refresh applications"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
            <div className="flex justify-center mt-4">
              <Button onClick={fetchApplications} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>{statusDisplayName} Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="border rounded-lg overflow-hidden shadow bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Employee Details</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No applications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.id}</TableCell>
                        <TableCell>{application.empName}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">ID: {application.empNo || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">
                              RUID: {application.ruidNo || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{application.department}</TableCell>
                        <TableCell>{application.station}</TableCell>
                        <TableCell>
                          <StatusBadge status={application.status} />
                        </TableCell>
                        <TableCell>
                          {renderActionButtons(application)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ID Card Preview</DialogTitle>
            <DialogDescription>
              Preview how the ID card will look after printing
            </DialogDescription>
          </DialogHeader>
          {renderIdCardPreview}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={!!action} onOpenChange={(open) => !open && resetActionDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action?.type === 'accept' ? 'Accept Application' : 'Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {action?.type === 'accept'
                ? 'Are you sure you want to accept this application?'
                : 'Please provide a reason for rejection. This will be visible to the applicant.'}
            </DialogDescription>
          </DialogHeader>

          {action?.type === 'reject' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="remark">Rejection Remarks</Label>
                <Textarea
                  id="remark"
                  placeholder="Enter reason for rejection..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="min-h-[100px]"
                  aria-describedby="remark-help"
                />
                <p id="remark-help" className="text-sm text-muted-foreground">
                  {!remark.trim() ? 
                    'Remarks are required to reject an application' : 
                    'This message will be shown to the applicant'
                  }
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={resetActionDialog}>
              Cancel
            </Button>
            <Button
              variant={action?.type === 'accept' ? 'default' : 'destructive'}
              onClick={() => action && handleStatusUpdate(action.rec, action.type)}
              disabled={action?.type === 'reject' && !remark.trim()}
            >
              {action?.type === 'accept' ? 'Accept' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}