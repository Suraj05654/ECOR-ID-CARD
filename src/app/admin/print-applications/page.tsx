'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RailwayIdCardDynamic } from '@/components/railway-id-card-dynamic';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer } from 'lucide-react';

interface Application {
  id: string;
  empNo: string;
  ruidNo: string;
  empName: string;
  designation: string;
  dob: string;
  department: string;
  station: string;
  photoUrl: string;
  signatureUrl: string;
  mobileNumber: string;
  familyMembers: { name: string; relationship: string; dob: string; bloodGroup: string }[];
}

export default function PrintApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/employees?status=Approved');
        const json = await res.json();
        
        // Ensure we have a valid array of employees
        if (!json || !json.employees || !Array.isArray(json.employees)) {
          console.error('Invalid response format:', json);
          toast.error('Invalid response format from server');
          return;
        }

        const list = json.employees.map((e: any) => ({
          id: e.id || e.$id,
          empNo: e.employeeNo || e.empNo || '',
          ruidNo: e.ruidNo || '',
          empName: e.employeeName || e.empName || e.name || e.fullName || 'Unknown',
          designation: e.designation || '',
          dob: e.dateOfBirth || e.dob || '',
          department: e.department || '',
          station: e.station || '',
          photoUrl: e.photoUrl || (e.photoFileId ? `/api/file/${e.photoFileId}` : ''),
          signatureUrl: e.signatureUrl || (e.signatureFileId ? `/api/file/${e.signatureFileId}` : ''),
          mobileNumber: e.mobileNumber || '',
          familyMembers: Array.isArray(e.familyMembersJson ? JSON.parse(e.familyMembersJson) : []) 
            ? (e.familyMembersJson ? JSON.parse(e.familyMembersJson) : []).map((fm: any) => ({
                name: fm.name || '',
                relationship: fm.relationship || fm.relation || '',
                dob: fm.dob || '',
                bloodGroup: fm.bloodGroup || '-'
              }))
            : []
        }));
        setApps(list);
      } catch (err) {
        console.error('Failed to load applications:', err);
        toast.error('Failed to load applications');
      }
    }
    load();
  }, []);

  const handlePrint = () => {
    if (!selected) {
      toast.error('Select an application first');
      return;
    }
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Print Applications</h1>
        <Button onClick={handlePrint} disabled={!selected} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Preview & Print
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Select</TableHead>
                <TableHead>RUID No</TableHead>
                <TableHead>Emp No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-center">
                    <input 
                      type="radio" 
                      name="sel" 
                      checked={selected?.id === a.id} 
                      onChange={() => setSelected(a)}
                      className="h-4 w-4 text-primary border-primary/20 focus:ring-primary/20"
                    />
                  </TableCell>
                  <TableCell>{a.ruidNo || '-'}</TableCell>
                  <TableCell>{a.empNo || '-'}</TableCell>
                  <TableCell>{a.empName}</TableCell>
                  <TableCell>{a.designation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Print ID Card</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 pt-2 pb-6">
            {selected && (
              <RailwayIdCardDynamic
                name={selected.empName}
                designation={selected.designation}
                pfNumber={selected.empNo}
                ruidNo={selected.ruidNo}
                station={selected.station}
                dateOfBirth={selected.dob}
                bloodGroup={selected.familyMembers[0]?.bloodGroup || 'N/A'}
                contactNumber={selected.mobileNumber || 'N/A'}
                address={selected.station}
                emergencyContact={selected.familyMembers.find(f => f.relationship?.toLowerCase() !== 'self')?.name || selected.empName}
                emergencyPhone={selected.mobileNumber || ''}
                medicalInfo={`Blood Group: ${selected.familyMembers[0]?.bloodGroup || 'N/A'}`}
                photoUrl={selected.photoUrl}
                signatureUrl={selected.signatureUrl}
                qrUrl={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({
                  name: selected.empName,
                  pfNumber: selected.ruidNo || selected.empNo,
                  designation: selected.designation,
                  dateOfBirth: selected.dob,
                  station: selected.station,
                  department: selected.department
                }))}`}
                familyMembers={selected.familyMembers.map((fm) => ({
                  name: fm.name,
                  relation: fm.relationship,
                  dob: fm.dob,
                  bloodGroup: fm.bloodGroup
                }))}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
