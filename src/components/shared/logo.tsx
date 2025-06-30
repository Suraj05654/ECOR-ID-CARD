'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Building } from 'lucide-react'; 

interface LogoProps {
  isHeader?: boolean;
}

const Logo = ({ isHeader = false }: LogoProps) => {
  return (
    <div className="flex items-center">
      <Image
        src="/ecor.png"
        alt="East Coast Railway Logo"
        width={isHeader ? 40 : 48}
        height={isHeader ? 40 : 48}
        className="object-contain"
      />
    </div>
  );
};

export const ITCentreLogoPlaceholder = () => {
  return (
    <div className="flex items-center">
      <Image
        src="/ecor.png"
        alt="East Coast Railway Logo"
        width={48}
        height={48}
        className="object-contain"
      />
    </div>
  );
};

export default Logo;
