// components/CarForm/OperationFileUpload.tsx
'use client';

import { X, Upload, Image as ImageIcon, Eye } from 'lucide-react';
import { cn } from "@/lib/utils";
import client from '@/lib/axios/interceptors';
import { SmartBillFile } from '../../service/type/types';
import { useSession } from 'next-auth/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from 'react';
import ImageDialog from '@/components/ImageDialog/ImageDialog';

interface OperationFileUploadProps {
  files: SmartBillFile[];
  onFilesChange: (files: SmartBillFile[]) => void;
  isUpdateMode?: boolean;
}

export default function OperationFileUpload({ 
  files, 
  onFilesChange,
  isUpdateMode = false
}: OperationFileUploadProps) {
  const { data: session } = useSession();
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success'>('error');

  //  เพิ่ม state สำหรับ Image Dialog
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const showAlert = (title: string, message: string, type: 'error' | 'success' = 'error') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertOpen(true);
  };

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024;

  const addFiles = async (incomingFiles: File[]) => {
    if (!incomingFiles.length) return;

    const remainingSlots = Math.max(0, 3 - files.length);
    if (remainingSlots === 0) {
      showAlert('ไฟล์เต็มแล้ว', 'สามารถอัพโหลดได้สูงสุด 3 รูป', 'error');
      return;
    }

    const accepted: SmartBillFile[] = [];
    const rejectedNames: string[] = [];

    for (const file of incomingFiles) {
      if (accepted.length >= remainingSlots) break;

      if (!validTypes.includes(file.type)) {
        rejectedNames.push(file.name);
        continue;
      }

      if (file.size > maxSize) {
        rejectedNames.push(file.name);
        continue;
      }

      const fileBlob = URL.createObjectURL(file);
      accepted.push({
        fileData: file,
        isExisting: false,
        image_url: fileBlob,
        image_name: file.name,
        operation_index: 0,
        sb_operationid: null,
        sb_image_id: 0,
        created_at: new Date().toISOString(),
      });
    }

    if (accepted.length) {
      onFilesChange([...files, ...accepted]);
    }

    if (rejectedNames.length) {
      showAlert(
        'มีบางไฟล์ถูกปฏิเสธ',
        'กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, GIF, WEBP) และขนาดไม่เกิน 5MB',
        'error'
      );
    }

    if (incomingFiles.length > remainingSlots) {
      showAlert('ไฟล์เกินจำนวน', `เพิ่มได้สูงสุด ${remainingSlots} รูปในครั้งนี้`, 'error');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const selected = Array.from(event.target.files || []);
    await addFiles(selected);
    event.target.value = '';
  };

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const dropped = Array.from(event.dataTransfer.files || []).filter((f) => f.type.startsWith('image/'));
    await addFiles(dropped);
  };

  const handleFileRemove = async (index: number) => {
    const fileToRemove = files[index];
    
    if (isUpdateMode && fileToRemove.isExisting && fileToRemove.sb_image_id) {
      try {
        const response = await client.post('/SmartBill_Operation_DeleteImage', {
          sb_image_id: fileToRemove.sb_image_id,
          usercode: session?.user?.UserCode || ''
        });
        console.log('Delete image response:', response.data);
        if (response.data[0].status === 'SUCCESS') {
          showAlert(
            "ลบไฟล์สำเร็จ", 
            `ไฟล์ ${fileToRemove.image_name} ถูกลบออกจากระบบแล้ว`, 
            'success'
          );
        } else {
          showAlert(
            "เกิดข้อผิดพลาด", 
            response.data.message || 'ไม่สามารถลบไฟล์ได้',
            'error'
          );
          return;
        }
      } catch (error: any) {
        console.error('Error deleting file from backend:', error);
        showAlert(
          "เกิดข้อผิดพลาด", 
          `ไม่สามารถลบไฟล์ได้: ${error.response?.data?.message || error.message || 'กรุณาลองใหม่อีกครั้ง'}`,
          'error'
        );
        return; 
      }
    } else {
      showAlert(
        "ลบไฟล์สำเร็จ", 
        `ไฟล์ ${fileToRemove.image_name} ถูกลบออกจากรายการแล้ว`, 
        'success'
      );
    }

    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  //  เปิด Image Dialog
  const handleViewImage = (index: number) => {
    setSelectedImageIndex(index);
    setImageDialogOpen(true);
  };

  //  แปลง files เป็น format ที่ ImageDialog ต้องการ
  const imageDialogData = files.map(file => ({
    file: file.image_url,
    filename: file.image_name || 'Unknown File'
  }));

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-900">
            รูปภาพประกอบ <span className="text-red-500">*</span> (สูงสุด 3 รูป)
          </label>
          <span className="text-xs text-gray-500">
            {files.length}/3
          </span>
        </div>

        {/* Upload Area */}
        {files.length < 3 && (
          <label
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={handleDrop}
            className={cn(
            "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all",
            "hover:bg-gray-50 hover:border-gray-400",
            "border-gray-300 bg-white"
          )}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-400" />
              <p className="mb-1 text-sm text-gray-600">
                <span className="font-semibold">คลิกเพื่ออัพโหลด</span> หรือลากไฟล์มาวาง
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP (สูงสุด 5MB)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
            />
          </label>
        )}

        {/* Files List */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                {/*  Image Container with View Button */}
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 relative">
                  <img
                    src={file.image_url}
                    alt={file.image_name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/*  Hover Overlay with View Button */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                    <button
                      onClick={() => handleViewImage(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 bg-white rounded-full hover:bg-gray-100 shadow-lg"
                      type="button"
                      aria-label="ดูรูปภาพ"
                    >
                      <Eye className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                </div>
                
                {/* File Info */}
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-600 truncate flex-1">
                    {file.image_name}
                  </p>
                  <button
                    onClick={() => handleFileRemove(index)}
                    className="ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Existing Badge */}
                {file.isExisting && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded">
                      ไฟล์จากเซิร์ฟเวอร์
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Validation Message */}
        {files.length === 0 && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <ImageIcon className="h-3 w-3" />
            กรุณาอัพโหลดรูปภาพอย่างน้อย 1 รูป
          </p>
        )}
      </div>

      {/*  Image Dialog */}
      <ImageDialog
        images={imageDialogData}
        initialIndex={selectedImageIndex}
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
      />

      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {alertTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              ตกลง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}