import { NextRequest, NextResponse } from 'next/server';
import { getEmployeesService, createEmployee } from '@/lib/new_admin_backend/services';
import { Query } from 'appwrite';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') ?? '1000', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const filters: Record<string, string> = {};
    const status = searchParams.get('status');
    // Only set status filter if it's provided and not 'all'
    if (status && status !== 'all') {
      filters.status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
    
    const department = searchParams.get('department');
    const station = searchParams.get('station');
    const applicantType = searchParams.get('applicantType');

    if (department) filters.department = department;
    if (station) filters.station = station;
    if (applicantType) (filters as any).applicantType = applicantType;

    // Get employees from service
    const { employees, total } = await getEmployeesService(filters, offset, limit);

    // Process and normalize the employee data
    const normalizedEmployees = employees.map((e: any) => {
      // Ensure consistent name mapping
      const name = e.employeeName || e.empName || e.name || e.fullName || 'Unknown';
      
      // Generate file URLs consistently
      const getFileUrl = (fileId: string) => fileId ? `/api/file/${fileId}` : '';
      
      return {
        id: e.id || e.$id,
        empNo: e.employeeNo || e.empNo || '',
        ruidNo: e.ruidNo || '',
        employeeName: name,
        empName: name, // For backward compatibility
        designation: e.designation || '',
        dob: e.dateOfBirth || e.dob || '',
        department: e.department || '',
        station: e.station || '',
        mobileNumber: e.mobileNumber || '',
        status: (e.status || 'Pending').toLowerCase(),
        applicationDate: e.applicationDate || e.$createdAt,
        createdAt: e.createdAt || e.$createdAt,
        updatedAt: e.updatedAt || e.$updatedAt,
        familyMembersJson: (() => {
          if (!e.familyMembersJson && !e.familyMembers) return '[]';
          if (typeof e.familyMembersJson === 'string') return e.familyMembersJson;
          if (Array.isArray(e.familyMembers)) return JSON.stringify(e.familyMembers);
          return '[]';
        })(),
        photoUrl: e.photoUrl || getFileUrl(e.photoFileId),
        signatureUrl: e.signatureUrl || getFileUrl(e.signatureFileId),
        hindiNameUrl: e.hindiNameUrl || getFileUrl(e.hindiNameFileId),
        hindiDesignationUrl: e.hindiDesignationUrl || getFileUrl(e.hindiDesignationFileId)
      };
    });

    return NextResponse.json({ employees: normalizedEmployees, total });
  } catch (error: any) {
    console.error('[API_EMPLOYEES] GET error', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Ensure required fields are present
    const requiredFields = [
      'employeeName',
      'designation',
      'department',
      'station',
      'dateOfBirth',
      'residentialAddress',
      'mobileNumber',
      'emergencyContactName',
      'emergencyContactNumber',
      'applicantType'
    ];

    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    // Validate applicant type specific fields
    if (data.applicantType === 'gazetted' && !data.ruidNo) {
      return NextResponse.json({
        success: false,
        message: 'RUID number is required for gazetted officers'
      }, { status: 400 });
    }
    if (data.applicantType === 'non-gazetted' && !data.employeeNo) {
      return NextResponse.json({
        success: false,
        message: 'Employee number is required for non-gazetted employees'
      }, { status: 400 });
    }

    // Set default values for required system fields
    const now = new Date().toISOString();
    data.status = 'Pending';
    data.applicationDate = now;
    data.createdAt = now;
    data.updatedAt = now;

    // Convert family members to JSON string if present
    if (Array.isArray(data.familyMembers)) {
      data.familyMembersJson = JSON.stringify(data.familyMembers);
      delete data.familyMembers;
    }

    const response = await createEmployee(data);
    return NextResponse.json({ 
      success: true, 
      applicationId: response.id || response.$id 
    });
  } catch (error: any) {
    console.error('[API_EMPLOYEES] POST error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to create employee record' 
    }, { status: 500 });
  }
}
