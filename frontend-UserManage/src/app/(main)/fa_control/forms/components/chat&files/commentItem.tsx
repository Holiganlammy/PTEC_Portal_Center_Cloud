"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import Image from "next/image";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Bangkok");

interface Props {
  comments: IComment[];
  onSend?: (text: string) => void; // คุณสามารถส่ง prop มาเพื่อ handle การส่งจริง
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

export function CommentItem({ comments, onSend }: Props) {
  const { data: session, status } = useSession({
  required: false,
});
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    if (onSend) {
      onSend(message);
    } else {
      console.log("ส่งข้อความ:", message);
    }
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4 max-w-3xl mx-auto">
      {/* แสดงรายการความคิดเห็น */}
      {comments.map((comment, index) => {
        const isLeft = session?.user?.UserCode !== comment.userid;

        return (
          <div
            key={index}
            className={`flex items-end ${isLeft ? "justify-start" : "justify-end"}`}
          >
            {/* Avatar ซ้าย */}
            {isLeft && (
              <div className="w-8 h-8 rounded-full bg-blue-300 text-white font-bold flex items-center justify-center mr-2">
                {(comment.userid || "U").charAt(0).toUpperCase()}
              </div>
            )}

            {/* ข้อความ */}
            <div
              className={`max-w-sm px-4 py-2 rounded-lg shadow text-sm whitespace-pre-line ${isLeft
                ? "bg-white text-gray-800 dark:bg-zinc-700 dark:text-white"
                : "bg-blue-500 text-white"
                }`}
            >
              <div className="font-medium mb-1">
                {comment.userid || "ไม่ระบุชื่อ"} ({getShortTimeAgo(dayjs.tz(comment.create_date).toDate())})
              </div>
              <div>{comment.comment || ""}</div>
            </div>

            {/* Avatar ขวา */}
            {!isLeft && comment.img_profile ? (
              <Image
                src={comment.img_profile}
                alt={comment.img_profile}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover ml-2"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 text-white font-bold flex items-center justify-center ml-2">
                {(comment.userid || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        );
      })}

      {/* ช่องกรอกข้อความ */}
      <div className="mt-6 flex items-end gap-2">
        <textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="พิมพ์ข้อความของคุณ..."
          className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring focus:ring-blue-300 dark:bg-zinc-800 dark:text-white dark:border-zinc-600"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
          disabled={!message.trim()}
        >
          ส่ง
        </button>
      </div>
    </div>
  );
}
