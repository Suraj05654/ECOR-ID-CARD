
'use client';

import type { UseFormRegisterReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormMessage } from '@/components/ui/form'; // Using FormMessage from react-hook-form context
import { Paperclip, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FileUploadProps {
  label: string;
  id: string;
  registration: UseFormRegisterReturn;
  error?: string; // This comes from react-hook-form errors object
  accept?: string; // e.g., ".jpg,.jpeg,.png" or "image/jpeg,image/png"
  required?: boolean;
  description?: string;
  watchField?: FileList | null; // To show file name if already selected
}

const FileUpload = ({ label, id, registration, error, accept, required, description, watchField }: FileUploadProps) => {
  const [fileName, setFileName] = useState<string | null>(null);
  // error prop from react-hook-form will be used directly by FormMessage

  useEffect(() => {
    if (watchField && watchField.length > 0) {
      setFileName(watchField[0].name);
    } else {
      setFileName(null);
    }
  }, [watchField]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (registration.onChange) {
      registration.onChange(event); 
    }
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName(null);
    }
  };

  const requiredAsterisk = required ? <span className="text-destructive ml-0.5">*</span> : null;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center text-sm font-medium">
        {label} {requiredAsterisk}
      </Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      
      <div 
        className={`flex items-center space-x-3 p-3 border-2 border-dashed rounded-md transition-all focus-within:ring-2 focus-within:ring-ring hover:border-primary/70
                    ${error ? 'border-destructive' : 'border-input'}`}
      >
        <UploadCloud className={`h-8 w-8 ${error ? 'text-destructive' : 'text-muted-foreground'}`} />
        <div className="flex-grow">
          <Input
            type="file"
            id={id}
            {...registration}
            onChange={handleFileChange}
            accept={accept} // Pass accept prop to input
            className="block w-full text-sm text-foreground 
                       file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
                       file:text-sm file:font-semibold 
                       file:bg-primary/10 file:text-primary hover:file:bg-primary/20 
                       cursor-pointer p-0 h-auto border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {fileName && !error && (
            <div className="mt-1 text-xs text-green-600 flex items-center">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Selected: {fileName}
            </div>
          )}
        </div>
      </div>
      
      {error && ( // FormMessage will be rendered by the FormField component typically
         <div className="mt-1 text-sm text-destructive flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
           {error} {/* Display the error message */}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
