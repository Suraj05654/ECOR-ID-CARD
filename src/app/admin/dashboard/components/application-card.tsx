'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Printer } from "lucide-react";
import { useState } from "react";
import { PrintPreview } from "./print-preview";

interface FamilyMember {
  name: string;
  relation: string;
  dob: string;
  bloodGroup: string;
}

interface ApplicationCardProps {
  id: number;
  employeeNumber: string;
  name: string;
  dob: string;
  address: string;
  emergencyContact: string;
  department: string;
  designation: string;
  applicationDate: string;
  photoUrl: string;
  signatureUrl: string;
  familyMembers: FamilyMember[];
}

export function ApplicationCard({
  id,
  employeeNumber,
  name,
  dob,
  address,
  emergencyContact,
  department,
  designation,
  applicationDate,
  photoUrl,
  signatureUrl,
  familyMembers,
}: ApplicationCardProps) {
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);

  return (
    <>
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="bg-gray-50 p-4 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Application ID: {employeeNumber}</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPrintPreviewOpen(true)}
              className="print:hidden"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <div><span className="font-medium">EMPNO:</span> {employeeNumber}</div>
              <div><span className="font-medium">EMPNAME:</span> {name}</div>
              <div><span className="font-medium">DOB:</span> {format(new Date(dob), 'PPP')}</div>
              <div><span className="font-medium">ADDRESS:</span> {address}</div>
            </div>
            
            <div className="space-y-2">
              <div><span className="font-medium">EMERGENCY CONTACT NAME:</span> {emergencyContact}</div>
              <div><span className="font-medium">DEPARTMENT:</span> {department}</div>
              <div><span className="font-medium">DESIGNATION:</span> {designation}</div>
            </div>
            
            <div className="space-y-2">
              <div><span className="font-medium">APPLICATION DATE:</span> {format(new Date(applicationDate), 'PPP')}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="border p-2 text-center">
              <div className="font-medium mb-2">QR Code</div>
              <div className="h-32 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">QR Code Placeholder</span>
              </div>
            </div>
            
            <div className="border p-2 text-center">
              <div className="font-medium mb-2">Photo</div>
              <div className="h-32 bg-gray-100 flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt="Employee" className="h-full w-auto object-cover" />
                ) : (
                  <span className="text-gray-400">No Photo</span>
                )}
              </div>
            </div>
            
            <div className="border p-2 text-center">
              <div className="font-medium mb-2">Signature</div>
              <div className="h-32 bg-gray-100 flex items-center justify-center">
                {signatureUrl ? (
                  <img src={signatureUrl} alt="Signature" className="h-full w-auto object-contain" />
                ) : (
                  <span className="text-gray-400">No Signature</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">Family Members:</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Name</th>
                    <th className="border px-4 py-2 text-left">Relation</th>
                    <th className="border px-4 py-2 text-left">DOB</th>
                    <th className="border px-4 py-2 text-left">Blood Group</th>
                  </tr>
                </thead>
                <tbody>
                  {familyMembers.map((member, index) => (
                    <tr key={index}>
                      <td className="border px-4 py-2">{member.name}</td>
                      <td className="border px-4 py-2">{member.relation}</td>
                      <td className="border px-4 py-2">{format(new Date(member.dob), 'PPP')}</td>
                      <td className="border px-4 py-2">{member.bloodGroup}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <PrintPreview 
        open={printPreviewOpen} 
        onClose={() => setPrintPreviewOpen(false)}
        title={`ID Card - ${name}`}
      >
        <div className="p-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">ID Card Application</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Employee Number</h3>
                  <p>{employeeNumber}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Name</h3>
                  <p>{name}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Date of Birth</h3>
                  <p>{format(new Date(dob), 'PPP')}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Department</h3>
                  <p>{department}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Designation</h3>
                  <p>{designation}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Application Date</h3>
                  <p>{format(new Date(applicationDate), 'PPP')}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Address</h3>
                <p className="whitespace-pre-line">{address}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Emergency Contact</h3>
                <p>{emergencyContact}</p>
              </div>
              
              {familyMembers.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Family Members</h3>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relation</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Group</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {familyMembers.map((member, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{member.name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{member.relation}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(member.dob), 'PPP')}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{member.bloodGroup}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <div className="border rounded-md p-4">
                <h3 className="font-semibold text-gray-700 mb-2 text-center">Photo</h3>
                <div className="flex justify-center">
                  <img 
                    src={photoUrl} 
                    alt={`${name}'s photo`} 
                    className="h-48 w-48 object-cover rounded-md border"
                  />
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-semibold text-gray-700 mb-2 text-center">Signature</h3>
                <div className="flex justify-center items-center h-24 border-t border-dashed pt-4">
                  <img 
                    src={signatureUrl} 
                    alt={`${name}'s signature`} 
                    className="h-16 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t text-sm text-gray-500 text-center">
            <p>This is a system generated document. No signature is required.</p>
            <p className="mt-1">Printed on: {format(new Date(), 'PPPppp')}</p>
          </div>
        </div>
      </PrintPreview>
    </>
  );
}
