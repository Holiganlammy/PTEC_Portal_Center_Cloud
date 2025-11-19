'use client';

import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import ImageDialog from '@/components/ImageDialog/ImageDialog';

interface FileUploadProps {
  dataFilesCount: any;
  onFileUpload: (event: any) => void;
  onFileRemove: (index: number) => void;
}

export default function FileUpload({ dataFilesCount, onFileUpload, onFileRemove }: FileUploadProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleOpenDialog = (index: number) => {
    setSelectedIndex(index);
    setDialogOpen(true);
  };

  // ✅ สร้างตัวแปรที่มีค่า default เป็น array ว่าง
  const files = dataFilesCount || [];

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium mr-5 text-gray-900">
        อัปโหลดรูปภาพ <span className="text-red-500">*</span>
      </label>
      <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-all">
        <Upload className="w-4 h-4" />
        <span>เลือกไฟล์</span>
        <input
          type="file"
          className="hidden"
          onChange={onFileUpload}
          accept="image/*"
        />
      </label>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {files.map((item: any, index: number) => (
            <div key={index} className="relative group cursor-pointer">
              <Image
                src={item.file}
                alt={item.filename}
                width={200}
                height={200}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                onClick={() => handleOpenDialog(index)}
              />
              <button
                onClick={() => onFileRemove(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Image Dialog */}
      <ImageDialog
        images={files.map((f: any) => ({ file: f.file, filename: f.filename }))}
        initialIndex={selectedIndex}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}