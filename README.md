# Railway ID Card Management System

A modern web application for managing railway employee ID card applications, built with Next.js 14, Tailwind CSS, and Appwrite.

## Features

### For Employees
- **Application Submission**
  - Separate forms for Gazetted and Non-Gazetted officers
  - Photo and signature upload
  - Hindi name and designation upload (for Gazetted officers)
  - Family member details management
  - QR code generation for each ID card

### For Administrators
- **Application Management**
  - View pending applications
  - Accept/Reject applications with remarks
  - Filter applications by status (Pending/Approved/Rejected)
  - Separate views for Gazetted and Non-Gazetted applications

### General Features
- **Status Tracking**
  - Employees can check their application status
  - Real-time status updates
  - View rejection remarks if applicable

- **Security**
  - Admin authentication and authorization
  - Secure file storage and handling
  - Input validation and sanitization

## Tech Stack

- **Frontend**
  - Next.js 14 (React Framework)
  - Tailwind CSS (Styling)
  - Shadcn UI (Component Library)
  - TypeScript

- **Backend**
  - Next.js Server Actions
  - Appwrite (Backend as a Service)
    - Authentication
    - Database
    - File Storage

## Prerequisites

- Node.js 18.x or higher
- Appwrite instance (self-hosted or cloud)
- npm or yarn package manager

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=your_appwrite_endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=your_bucket_id
NEXT_PUBLIC_APPWRITE_EMPLOYEES_COLLECTION_ID=your_collection_id
```

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd railway-id-card-system
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── api/               # API routes
│   │   ├── apply/             # Application forms
│   │   └── status/            # Status checking page
│   ├── components/            # Reusable components
│   │   ├── auth/             # Authentication components
│   │   ├── forms/            # Form components
│   │   ├── shared/           # Shared components
│   │   └── ui/               # UI components
│   └── lib/                   # Utility functions and services
│       ├── actions/          # Server actions
│       └── new_admin_backend/ # Backend services
```

## Database Schema

### Employees Collection
- `id`: Unique identifier
- `status`: Application status (Pending/Approved/Rejected)
- `applicantType`: Gazetted/Non-Gazetted
- `employeeName`: Full name
- `designation`: Job designation
- `employeeNo`: Employee number (for Non-Gazetted)
- `ruidNo`: RUID number (for Gazetted)
- `dateOfBirth`: Date of birth
- `department`: Department name
- `station`: Work station
- `mobileNumber`: Contact number
- `familyMembersJson`: Family members array
- `photoFileId`: Photo file reference
- `signatureFileId`: Signature file reference
- `hindiNameFileId`: Hindi name file reference (optional)
- `hindiDesignationFileId`: Hindi designation file reference (optional)
- `remark`: Rejection remarks (if applicable)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 