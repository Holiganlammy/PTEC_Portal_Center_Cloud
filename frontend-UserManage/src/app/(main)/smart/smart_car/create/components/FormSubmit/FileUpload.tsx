'use client';

import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  dataFilesCount: any;
  onFileUpload: (event: any) => void;
  onFileRemove: (index: number) => void;
}

export default function FileUpload({ dataFilesCount, onFileUpload, onFileRemove }: FileUploadProps) {
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

      {dataFilesCount && dataFilesCount.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {dataFilesCount.map((item: any, index: number) => (
            <div key={index} className="relative group">
              <img
                src={item.file}
                alt={item.filename}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
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
    </div>
  );
}