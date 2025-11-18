"use client";

import { useSession } from "next-auth/react";
import { useState, ChangeEvent, FormEvent } from "react";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import Image from "next/image";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Bangkok");

interface Props {
  fileItem: FileItemType[];
  onUpload?: (file: File, description: string) => Promise<void>; // callback อัปโหลดไฟล์ใหม่
}

function getShortTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "เมื่อสักครู่";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  return `${days} วันที่แล้ว`;
}

export function FileItem({ fileItem, onUpload }: Props) {
  const { data: session, status } = useSession({
  required: false,
});

  // สเตตสำหรับอัปโหลดไฟล์ใหม่
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "คำเตือน",
        text: "กรุณาเลือกไฟล์ก่อนอัปโหลด",
      });
      return;
    }

    if (!description.trim()) {
      Swal.fire({
        icon: "warning",
        title: "คำเตือน",
        text: "กรุณากรอกรายละเอียดของไฟล์แนบ",
      });
      return;
    }

    const MAX_SIZE_MB = 10;
    if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "คำเตือน",
        text: `ไฟล์ใหญ่เกิน ${MAX_SIZE_MB}MB`,
      });
      return;
    }

    setUploading(true);
    try {
      if (onUpload) {
        await onUpload(selectedFile, description);
        setSelectedFile(null);
        setDescription("");
      } else {
        console.log("อัปโหลดไฟล์", selectedFile, "พร้อมรายละเอียด:", description);
      }

      setSelectedFile(null);
      setDescription("");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาดในการอัปโหลด",
        text: error instanceof Error ? error.message : "ไม่สามารถอัปโหลดไฟล์ได้",
      });
    }
    setUploading(false);
  };

  return (
    <div className="flex flex-col space-y-6 max-w-3xl mx-auto">
      {/* ฟอร์มอัปโหลดไฟล์ */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3"
      >
        <div className="border border-zinc-700 bg-gray-50 rounded-lg p-4 cursor-pointer">
          <label className="block font-medium text-gray-700 dark:text-gray-300">
            คลิกที่นี่เพื่อเลือกไฟล์
            <input
              type="file"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              dark:file:bg-zinc-700 dark:file:text-white
              dark:hover:file:bg-zinc-600"
              accept="*"
            />
          </label>
        </div>
        <label className="block font-medium text-gray-700 py-2 dark:text-gray-300">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="ใส่ข้อความอธิบายไฟล์แนบ"
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white mb-2"
          />
        </label>

        <button
          type="submit"
          disabled={uploading || !selectedFile}
          className="self-end bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {uploading ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์"}
        </button>
      </form>

      {/* รายการไฟล์แนบ */}
      <div className="flex flex-col space-y-4">
        {fileItem.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center">ยังไม่มีไฟล์แนบ</p>
        )}

        {fileItem.map((file, index) => (
          <div key={index} className="flex items-start space-x-3 w-full">
            {/* Avatar */}

            {file.img_profile ? (
              <Image
                src={file.img_profile}
                alt={file.img_profile}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover flex items-center justify-center select-none"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-green-400 text-white font-bold flex items-center justify-center select-none">
                {(file.userid || "U").charAt(0).toUpperCase()}
              </div>
            )}

            {/* กล่องเนื้อหาไฟล์แนบ */}
            <div className="flex-1 max-w-full p-3 rounded-lg shadow whitespace-pre-wrap break-words text-sm bg-gray-100 dark:bg-zinc-700 text-gray-800 dark:text-white">
              <div className="font-medium mb-1">
                {file.userid || "ไม่ระบุชื่อ"} ({getShortTimeAgo(dayjs.tz(file.create_date).toDate())})
              </div>
              {file.description && <p className="mt-1">{file.description}</p>}
              {/* ชื่อไฟล์ / ลิงก์ดาวน์โหลด */}
              {file.linkpath ? (
                <a
                  href={file.linkpath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                >
                  {file.linkpath || "ไฟล์แนบ"}
                </a>
              ) : (
                <span className="font-semibold">{file.description || "ไฟล์แนบ"}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}