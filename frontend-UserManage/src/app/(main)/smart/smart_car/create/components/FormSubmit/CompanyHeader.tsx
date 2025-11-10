'use client';

import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import logoPure from "@/image/Picture1.png";
import logosct from "@/image/Picture2.png";
import logosmplus from "@/image/LogoSMPlus.png";

interface CompanyHeaderProps {
  companyName: string;
  onCompanyChange: (value: string) => void;
  sbCode?: string;
}

export default function CompanyHeader({ companyName, onCompanyChange, sbCode }: CompanyHeaderProps) {
  return (
    <div className="border-b border-gray-200 bg-white p-8">
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-3">
          {/* Company Logo */}
          <div className="flex justify-center">
            <Image 
              src={
                companyName === 'SCT' ? logosct :
                companyName === 'SMPlus' ? logosmplus :
                logoPure
              } 
              alt={`${companyName} Logo`} 
              width={100} 
              height={100}
              className="object-contain"
            />
          </div>
        </div>
        <div className="col-span-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {companyName === 'SCT' ? 'SCT SAHAPAN COMPANY LIMITED' : 
             companyName === 'SMPlus' ? 'SMPLUS COMPANY LIMITED' : 
             'PURE THAI ENERGY CO.,LTD.'}
          </h1>
          <p className="text-sm font-medium text-gray-600">Smart Car Form</p>
        </div>
        <div className="col-span-3">
          <div className="h-10 border-2 border-gray-300 rounded-md flex items-center justify-center">
            <span className="text-xs text-gray-500 font-medium">{('เลขที่เอกสาร: ' + sbCode) || 'None'}</span>
          </div>
        </div>
      </div>

      {/* Company Selection */}
      <div className="mt-8 space-y-3">
        <Label className="text-sm font-semibold text-gray-900">
          Company <span className="text-red-500">*</span>
        </Label>
        <RadioGroup 
          value={companyName} 
          onValueChange={onCompanyChange}
          className="flex gap-6"
        >
          {['PTEC', 'SCT', 'SMPlus'].map((company) => (
            <div key={company} className="flex items-center space-x-2">
              <RadioGroupItem value={company} id={`r-${company}`} />
              <Label htmlFor={`r-${company}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                {company}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}