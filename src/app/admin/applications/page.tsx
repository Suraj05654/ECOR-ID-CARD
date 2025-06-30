'use client';

import { useEffect, useState } from 'react';
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
import { format } from 'date-fns';
import { Check, X, StickyNote, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateApplicationStatus } from '@/lib/actions/application';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from "@/components/ui/label";

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
  status: string;
  remark?: string;
  familyMembers: FamilyMemberApi[];
  hindiNameUrl?: string;
  hindiDesignationUrl?: string;
  ruidNo?: string;
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary';
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

export default function ApplicationsPage() {
  const [rows, setRows] = useState<ApplicationApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ApplicationApi | null>(null);
  const [action, setAction] = useState<{
    type: 'accept' | 'reject';
    rec: ApplicationApi;
  } | null>(null);
  const [remark, setRemark] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending');

  const params = useSearchParams();
  const type = params?.get('type');
  const title = type === 'ng' ? 'Non-Gazetted Applications' : 'Gazetted Applications';

  const fetchRows = async () => {
    try {
      setLoading(true);
      const applicantType = type === 'ng' ? 'non-gazetted' : type === 'gaz' ? 'gazetted' : '';
      const qs = new URLSearchParams();
      if (applicantType) qs.set('applicantType', applicantType);
      if (selectedStatus !== 'all') qs.set('status', selectedStatus.toLowerCase());
      const res = await fetch(`/api/employees?${qs.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const { employees } = await res.json();

      const mapped: ApplicationApi[] = employees.map((e: any) => ({
        id: e.id || e.$id,
        empNo: e.employeeNo || e.empNo,
        ruidNo: e.ruidNo,
        empName: e.employeeName || e.empName,
        designation: e.designation,
        dob: e.dateOfBirth || e.dob,
        department: e.department,
        station: e.station,
        mobileNumber: e.mobileNumber,
        emergencyName: e.emergencyContactName,
        emergencyPhone: e.emergencyContactNumber,
        applicationDate: (e.applicationDate || e.$createdAt).split('T')[0],
        photoUrl: e.photoUrl || (e.photoFileId ? `/api/file/${e.photoFileId}` : ''),
        signatureUrl: e.signatureUrl || (e.signatureFileId ? `/api/file/${e.signatureFileId}` : ''),
        hindiNameUrl: e.hindiNameUrl || (e.hindiNameFileId ? `/api/file/${e.hindiNameFileId}` : ''),
        hindiDesignationUrl: e.hindiDesignationUrl || (e.hindiDesignationFileId ? `/api/file/${e.hindiDesignationFileId}` : ''),
        qrUrl: e.qrFileId ? `/api/file/${e.qrFileId}` : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({
          name: e.employeeName || e.empName,
          pfNumber: e.ruidNo || e.employeeNo || e.empNo,
          designation: e.designation,
          dateOfBirth: e.dateOfBirth || e.dob,
          station: e.station,
          department: e.department
        }))}`,
        status: (e.status || 'Pending').toLowerCase(),
        remark: e.remark,
        familyMembers: e.familyMembersJson ? JSON.parse(e.familyMembersJson) : []
      }));

      setRows(mapped);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [type, selectedStatus]);

  const updateStatus = async (rec: ApplicationApi, type: 'accept' | 'reject') => {
    try {
      if (type === 'reject' && !remark.trim()) {
        toast.error('Please provide rejection remarks');
        return;
      }

      console.log(`[UPDATE_STATUS] Starting update for application:`, {
        id: rec.id,
        type,
        currentStatus: rec.status,
        name: rec.empName
      });

      const result = await updateApplicationStatus(
        rec.id,
        type === 'accept' ? 'approved' : 'rejected',
        type === 'reject' ? remark : undefined
      );
      
      console.log(`[UPDATE_STATUS] Update result:`, result);

      if (!result.success) {
        console.error(`[UPDATE_STATUS] Failed:`, result.message);
        toast.error(result.message || 'Failed to update status');
        return;
      }

      toast.success(`${type === 'accept' ? 'Accepted' : 'Rejected'} ${rec.empName}`);
      setAction(null);
      setRemark('');
      await fetchRows();
      console.log(`[UPDATE_STATUS] Successfully completed update and refreshed data`);
    } catch (e: any) {
      console.error('[UPDATE_STATUS] Error:', e);
      toast.error(e.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchRows} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedStatus === 'all' ? 'All' : selectedStatus === 'pending' ? 'Pending' : selectedStatus === 'approved' ? 'Approved' : 'Rejected'} Applications
          </CardTitle>
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
                  {rows.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium">{rec.id}</TableCell>
                      <TableCell>{rec.empName}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">ID: {rec.empNo || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">RUID: {rec.ruidNo || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>{rec.department}</TableCell>
                      <TableCell>{rec.station}</TableCell>
                      <TableCell>
                        <StatusBadge status={rec.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreview(rec)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {rec.status.toLowerCase() === 'pending' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => setAction({ type: 'accept', rec })}
                                title="Approve Application"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setAction({ type: 'reject', rec })}
                                title="Reject Application"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {rec.status.toLowerCase() === 'rejected' && rec.remark && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast.info(rec.remark || 'None', {
                                description: 'Rejection Remarks'
                              })}
                              title="View Rejection Remarks"
                            >
                              <StickyNote className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
          {preview && (
            <div className="space-y-6">
              <RailwayIdCardDynamic
                name={preview.empName}
                designation={preview.designation}
                dateOfBirth={preview.dob}
                department={preview.department}
                station={preview.station}
                pfNumber={preview.empNo}
                ruidNo={preview.ruidNo}
                photoUrl={preview.photoUrl}
                signatureUrl={preview.signatureUrl}
                qrUrl={preview.qrUrl}
                hindiNameUrl={preview.hindiNameUrl}
                hindiDesignationUrl={preview.hindiDesignationUrl}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={!!action} onOpenChange={(open) => {
        if (!open) {
          setAction(null);
          setRemark('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action?.type === 'accept' ? 'Accept Application' : 'Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {action?.type === 'accept'
                ? 'Are you sure you want to accept this application? This action cannot be undone.'
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
                />
                {!remark.trim() && (
                  <p className="text-sm text-muted-foreground">
                    Remarks are required to reject an application
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAction(null);
                setRemark('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={action?.type === 'accept' ? 'default' : 'destructive'}
              onClick={() => action && updateStatus(action.rec, action.type)}
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

