"use client"
import { useState, useEffect, useRef, useCallback } from 'react';
import { Package, Loader2, Image as ImageIcon, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import client from '@/lib/axios/interceptors';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAutoData } from "../list_asset_counted/service/documentService";
import { EbookFilterBar } from './components/EbookBar/Bar';

export default function FAControlEbookPage() {
  const { data: session, status } = useSession();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ฟังก์ชันกำหนดสีตามสถานะ
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('รอตัดชำรุด') && !statusLower.includes('qr')) {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    }
    if (statusLower.includes('สภาพดี') && !statusLower.includes('qr')) {
      return 'bg-green-100 text-green-800 border-green-300';
    }
    if (statusLower.includes('ชำรุดรอซ่อม') && !statusLower.includes('qr')) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (statusLower.includes('QR Code ไม่สมบูรณ์') && statusLower.includes('สภาพดี')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (statusLower.includes('QR Code ไม่สมบูรณ์') && statusLower.includes('รอตัดชำรุด')) {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    if (statusLower.includes('QR Code ไม่สมบูรณ์') && statusLower.includes('ชำรุดรอซ่อม')) {
      return 'bg-rose-100 text-rose-800 border-rose-300';
    }
    
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    hasNext: true,
  });
  const [filterOptions, setFilterOptions] = useState<FilterOption>({});
  const [typeCode, setTypeCode] = useState<Assets_TypeGroup[]>([]);
  const [activeType, setActiveType] = useState<string>("PTEC");
  const [currentFilters, setCurrentFilters] = useState({
    code: "",
    name: "",
    owner: "",
    group: "",
    location: "",
    search: "",
  })
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadAssets = useCallback(async (page: number, selectedType = activeType, filters = currentFilters) => {
      if (status !== "authenticated" || !session?.user?.UserCode) return;
      if (loading) return;

      if (page === 1) setInitialLoading(true);
      else setLoading(true);
      setError(null);

      try {
        const response = await client.get<ApiResponse>(
          `/FA_Control_Fetch_Assets`,
          {
            params: {
              usercode: session.user.UserCode,
              typeCode: selectedType,
              page,
              limit: 12,
              code: filters.code || undefined,
              name: filters.name || undefined,
              owner: filters.owner || undefined,
              group: filters.group || undefined,
              location: filters.location || undefined,
              search: filters.search || undefined,
            },
          }
        );

        const data = response.data;
        if (page === 1) setAssets(data.data || []);
        else setAssets(prev => [...prev, ...(data.data || [])]);

        setPagination({
          page: data.pagination?.page || page,
          total: data.pagination?.total || 0,
          hasNext: data.pagination?.hasNext ?? false,
        });
      } catch (err: any) {
        setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [status, session?.user?.UserCode, loading, activeType, currentFilters]
  );

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await client.get("FA_Control_Fetch_Assets_FilterOptions");
        const data = response.data;
        // console.log("Filter Options:", data);
        setFilterOptions(data);
      } catch (err) {
        console.error("Error fetching filter options:", err);
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.UserCode) {
      loadAssets(1,activeType);
    }
  }, [status, session?.user?.UserCode, activeType]);

  useEffect(() => {
    loadAssets(1, activeType);
    (async () => {
      try {
        const dataOther = await getAutoData();
        const groupData = dataOther?.find((d) => d.key === "typeGroup")?.data || [];

        const groupedTypes = groupData.map((g: Assets_TypeGroup) => {
          const count = assets.filter(a => a.typeCode === g.typeCode).length;
          return { ...g, count };
        });

        setTypeCode(groupedTypes);
      } catch (err) {
        console.error("Error loading typeGroup:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!typeCode.length || !assets.length) return;

    const updated = typeCode.map(g => {
      const count = assets.filter(a => a.typeCode === g.typeCode).length;
      return { ...g, count };
    });
    setTypeCode(updated);
  }, [assets]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasNext && !loading && !initialLoading) {
          console.log("👁️ Reached bottom, loading more...");
          loadAssets(pagination.page + 1);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [pagination.hasNext, pagination.page, loading, initialLoading, loadAssets]);

  const handleFilterChange = useCallback((filters: any) => {
      setCurrentFilters(filters)
      loadAssets(1, activeType, filters)
  }, [loadAssets])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-slate-600" />
          <p className="text-slate-600 font-medium">กำลังโหลดระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <EbookFilterBar
          typeCode={typeCode}
          activeType={activeType}
          setActiveType={setActiveType}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
        />

        {/* Loading Skeletons */}
        {initialLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-slate-200 shadow-sm">
                <CardContent className="p-0">
                  <Skeleton className="h-56 w-full rounded-t-lg" />
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !initialLoading && (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto border border-red-100">
              <div className="bg-red-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Package className="w-10 h-10 text-red-500" />
              </div>
              <p className="text-slate-700 text-lg mb-6 font-medium">{error}</p>
              <Button
                onClick={() => loadAssets(1)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg shadow-md"
              >
                ลองอีกครั้ง
              </Button>
            </div>
          </div>
        )}

        {/* Assets Grid */}
        {!initialLoading && !error && assets.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
              {assets.map((asset, index) => (
                <Card
                  key={`${asset.AssetID}-${index}`}
                  className="group overflow-hidden border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 bg-white"
                >
                  <CardContent className="p-0">
                    {/* Image Section */}
                    <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                      {asset.ImagePath ? (
                        <div className="flex w-full h-full">
                          {[asset.ImagePath, asset.ImagePath_2]
                            .filter(Boolean)
                            .map((img, idx) => (
                              <Dialog key={idx}>
                                <DialogTrigger asChild>
                                  <div className="relative flex-1 cursor-pointer overflow-hidden group/image">
                                    <Image
                                      src={img!}
                                      alt={`${asset.Name} - ภาพที่ ${idx + 1}`}
                                      fill
                                      className="object-cover transition-transform duration-500 group-hover/image:scale-110"
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/image:opacity-100 transition-opacity duration-300" />
                                    </div>
                                    {idx === 0 && asset.ImagePath_2 && (
                                      <div className="absolute top-3 right-3">
                                        <Badge className="bg-black/70 text-white text-xs px-2 py-1 backdrop-blur-sm">
                                          {[asset.ImagePath, asset.ImagePath_2].filter(Boolean).length} รูป
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-5xl">
                                  <DialogHeader>
                                    <DialogTitle className="text-xl font-semibold text-slate-900">
                                      {asset.Name || 'ดูรูปภาพทรัพย์สิน'}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="relative w-full h-[75vh] bg-slate-100 rounded-lg overflow-hidden">
                                    <Image
                                      src={img!}
                                      alt="รูปภาพขนาดเต็ม"
                                      fill
                                      className="object-contain"
                                      sizes="100vw"
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="w-20 h-20 text-slate-300 group-hover:text-slate-400 transition-colors" />
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-6 space-y-3">
                      <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-2 min-h-[3.5rem] group-hover:text-slate-700 transition-colors">
                        {asset.Name || 'ไม่มีชื่อทรัพย์สิน'}
                      </h3>

                      {asset.Code && (
                        <div className="flex items-baseline gap-2 pb-2 border-b border-slate-100">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            รหัสทรัพย์สิน
                          </span>
                          <span className="text-sm font-mono font-medium text-slate-900 bg-slate-50 px-2 py-0.5 rounded">
                            {asset.Code}
                          </span>
                        </div>
                      )}

                      <div className="space-y-2 pt-2">
                        {/* {asset.SerialNo && ( */}
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-medium text-slate-500 min-w-[80px] pt-0.5">
                              Serial No:
                            </span>
                            <span className="text-sm text-slate-700 font-mono">
                              {asset.SerialNo ? asset.SerialNo : '-'}
                            </span>
                          </div>
                        {/* )} */}

                        {asset.OwnerID && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-medium text-slate-500 min-w-[80px] pt-0.5">
                              ผู้ถือครอง:
                            </span>
                            <span className="text-sm text-slate-700 font-medium">
                              {asset.OwnerID}
                            </span>
                          </div>
                        )}

                        {asset.Group_name && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-medium text-slate-500 min-w-[80px] pt-0.5">
                              กลุ่ม:
                            </span>
                            <Badge variant="outline" className="text-xs font-medium text-slate-700 border-slate-300">
                              {asset.Group_name}
                            </Badge>
                          </div>
                        )}

                        {asset.Details && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-xs text-slate-500 mr-2">
                              สถานะ : 
                            </span>
                            <Badge variant="outline" className={`text-xs font-medium ${getStatusColor(asset.Details)}`}>
                              {asset.Details}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Intersection Observer Target - จุดที่ใช้ตรวจจับ */}
            <div ref={observerTarget} className="h-20 flex items-center justify-center">
              {loading && !initialLoading && (
                <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl shadow-md border border-slate-200">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                  <span className="text-slate-600 font-medium">กำลังโหลดข้อมูลเพิ่มเติม...</span>
                </div>
              )}
            </div>

            {/* End Message */}
            {!loading && !pagination.hasNext && (
              <div className="text-center py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-sm mx-auto">
                  <div className="bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Package className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="font-semibold text-slate-900 text-lg mb-1">แสดงครบทุกรายการแล้ว</p>
                  <p className="text-sm text-slate-500">ไม่มีข้อมูลเพิ่มเติม</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !initialLoading && !error && assets.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto border border-slate-200">
              <div className="bg-slate-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Package className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ไม่พบรายการทรัพย์สิน</h3>
              <p className="text-slate-500 mb-6">ยังไม่มีข้อมูลทรัพย์สินในระบบ</p>
              <Button
                onClick={() => loadAssets(1)}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                รีเฟรช
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}