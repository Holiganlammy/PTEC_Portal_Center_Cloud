'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import Image from "next/image";

interface ImageDialogProps {
  images: { file: string; filename: string }[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImageDialog({ 
  images, 
  initialIndex, 
  open, 
  onOpenChange 
}: ImageDialogProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [scale, setScale] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  
  const imageContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, open]);

  // ✅ Reset position เมื่อเปลี่ยนรูปหรือ reset zoom
  React.useEffect(() => {
    if (scale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // ✅ Zoom ด้วย wheel
  React.useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY / 500;
      setScale(prev => {
        const newScale = Math.min(Math.max(0.5, prev + delta), 5);
        // Reset position ถ้า zoom กลับมา 1
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
        return newScale;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // ✅ Handle Mouse Down - เริ่มลาก
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return; // ลากได้เฉพาะตอนซูม
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // ✅ Handle Mouse Move - ลาก
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  // ✅ Handle Mouse Up - หยุดลาก
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ✅ Handle Touch Events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1) return;
    
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || scale <= 1) return;

    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!images || images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1500px] h-[90vh] p-0 bg-black rounded-lg overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>รูปภาพ</DialogTitle>
        </VisuallyHidden>

        {/* ปุ่มปิด */}
        <DialogClose className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full hover:bg-black/70 text-white transition-colors">
          <X className="w-6 h-6" />
        </DialogClose>

        {/* Zoom indicator */}
        <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-black/50 rounded-full text-white text-sm font-medium">
          {Math.round(scale * 100)}%
        </div>

        {/* ภาพใหญ่ + zoom + pan */}
        <div 
          ref={imageContainerRef}
          className="relative w-full h-full flex items-center justify-center overflow-hidden select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            cursor: scale > 1 
              ? (isDragging ? 'grabbing' : 'grab')
              : ''
          }}
        >
          <div 
            className="relative transition-transform"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transitionDuration: isDragging ? '0ms' : '100ms',
              transitionProperty: isDragging ? 'none' : 'transform'
            }}
          >
            <Image
              src={images[currentIndex].file}
              alt={images[currentIndex].filename}
              width={1200}
              height={1200}
              className="object-contain max-w-full max-h-full select-none pointer-events-none"
              style={{
                maxHeight: 'calc(90vh - 100px)',
                width: 'auto',
                height: 'auto'
              }}
              draggable={false}
            />
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 rounded-full hover:bg-black/70 text-white transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 rounded-full hover:bg-black/70 text-white transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Navigation dots */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { 
                    e.stopPropagation();
                    setCurrentIndex(i); 
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === currentIndex 
                      ? "bg-white w-8" 
                      : "bg-white/50 hover:bg-white/70"
                  }`}
                  aria-label={`ไปที่รูปที่ ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center z-20 pointer-events-none">
            <div className="px-3 py-1.5 bg-black/50 rounded-full text-white text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-6 right-6 z-20 flex gap-2">
          <button
            onClick={() => {
              setScale(prev => Math.max(0.5, prev - 0.2));
            }}
            disabled={scale <= 0.5}
            className="p-2 bg-black/50 rounded-full hover:bg-black/70 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="ซูมออก"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <button
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="px-3 py-2 bg-black/50 rounded-full hover:bg-black/70 text-white text-xs font-medium transition-colors"
          >
            รีเซ็ต
          </button>
          
          <button
            onClick={() => setScale(prev => Math.min(5, prev + 0.2))}
            disabled={scale >= 5}
            className="p-2 bg-black/50 rounded-full hover:bg-black/70 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="ซูมเข้า"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Hint text เมื่อ zoom */}
        {scale > 1 && (
          <div className="absolute top-16 left-4 z-20 px-3 py-1.5 bg-black/50 rounded-full text-white text-xs">
            ลากเพื่อเลื่อนดูรูป
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}