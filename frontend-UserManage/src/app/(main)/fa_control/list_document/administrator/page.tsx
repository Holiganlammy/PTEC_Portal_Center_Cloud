"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PageLoading from "@/components/PageLoading";
import { getAutoDataNAC, getAutoData } from "../service/documentService";
import UserTable from "../NacTable/NacTable";
import FilterForm from "../components/NacComponents/FilterForm";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { exportToExcel } from "../service/export";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";


export default function NacListAdministrator() {
  const { data: session, status } = useSession({
  required: false,
});
  const searchParams = useSearchParams();
  const nac_type = searchParams.get("type") || "user";

  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [typeGroup, setTypeGroup] = useState<Assets_TypeGroup[]>([]);
  const [nacStatus, setNacStatus] = useState<{ nac_status_id: number; status_name: string; }[]>([]);
  const [typeString, setTypeString] = useState<string | null>('PTEC');
  const [nacFetch, setNacFetch] = useState<List_NAC[]>([]);
  const [filters, setFilters] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nac_filters");
      return saved
        ? JSON.parse(saved)
        : {
          nac_code: "",
          name: "",
          source_userid: "",
          des_userid: "",
          status_name: "",
          filter: "",
        };
    }
    return {
      nac_code: "",
      name: "",
      source_userid: "",
      des_userid: "",
      status_name: "",
      filter: "",
    };
  });
  const fetchNac = useCallback(async () => {
    if (!session?.user?.UserCode) return;

    try {
      const dataOther = await getAutoData();
      setTypeGroup(dataOther?.find((d: { key: string }) => d.key === "typeGroup")?.data || []);
      setNacStatus(dataOther?.find((d: { key: string }) => d.key === "nacStatus")?.data || []);

      let dataNAC;

      //  ตรวจ role จาก session (หลัก audit)
      switch (session.user.role_id) {
        case 1: // Admin
          dataNAC = await getAutoDataNAC(session.user.UserCode, 'admin');
          break;

        case 3: // Moderator FA
          dataNAC = await getAutoDataNAC(session.user.UserCode, 'moderator');
          break;
      }

      const list = dataNAC?.[0]?.data || [];
      setNacFetch(list);

    } catch (error) {
      console.error("Error fetching NAC:", error);
    } finally {
      setIsChecking(false);
    }
  }, [session]);


  useEffect(() => {
    if (!isChecking) return;
    fetchNac();
  }, [isChecking, fetchNac]);

  useEffect(() => {
    const isHardReload =
      typeof window !== "undefined" &&
      (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)?.type === "reload";

    const cacheKey = `nac_already_loaded_${nac_type}`;
    const alreadyLoaded = sessionStorage.getItem(cacheKey);

    if (isHardReload || !alreadyLoaded) {
      // เคลียร์ cache ถ้า reload page
      if (isHardReload && session?.user?.UserCode) {
        sessionStorage.removeItem("autoData_cache");
        sessionStorage.removeItem("autoData_cache_time");
        sessionStorage.removeItem(`autoDataNAC_${session.user.UserCode}`);
        sessionStorage.removeItem(`autoDataNAC_time_${session.user.UserCode}`);
      }

      setIsChecking(true); //  สั่ง fetch จริง
      sessionStorage.setItem(cacheKey, "1"); //  ตั้ง flag ว่าโหลดแล้ว
    } else {
      // ถ้าเคยโหลดแล้ว และไม่ใช่ reload → ไม่ fetch ใหม่
      setIsChecking(false);
    }
  }, [session?.user?.UserCode, nac_type]);

  const filteredNac = useMemo(() => {
    return nacFetch.filter((nac) => {
      if (typeString && nac.TypeCode !== typeString) return false;
      if (filters.nac_code && nac.nac_code?.toString() !== filters.nac_code) return false;
      if (filters.name && nac.name?.toString() !== filters.name) return false;
      if (filters.source_userid && nac.source_userid?.toString() !== filters.source_userid) return false;
      if (filters.des_userid && nac.des_userid?.toString() !== filters.des_userid) return false;
      if (filters.status_name && nac.status_name?.toString() !== filters.status_name) return false;
      return true;
    });
  }, [nacFetch, filters, typeString]);

  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    localStorage.setItem("nac_filters", JSON.stringify(newFilters));
  }, []);

  if (isChecking) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-12">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-primary dark:text-white">
                  FA Control Document
                </CardTitle>
                <CardDescription>
                  Manage and monitor all document in your system
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm cursor-pointer"
                  onClick={() => exportToExcel(filteredNac)}
                >
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>

                <Button
                  className="text-xs sm:text-sm cursor-pointer"
                  variant="outline"
                  size="sm"
                  onClick={fetchNac}
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <FilterForm
                  filters={filters}
                  nacFetch={nacFetch}
                  onFiltersChange={handleFiltersChange}
                />
              </div>

            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                  <Tabs value={typeString ?? ""} onValueChange={setTypeString}>
                    <TabsList className="inline-flex w-full flex-wrap gap-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-1 border border-gray-200 dark:border-gray-800">
                      {typeGroup.map((type) => (
                        <TabsTrigger
                          key={type.typeGroupID}
                          value={type.typeCode}
                          className={cn(
                            "flex-1 min-w-fit px-6 py-3 rounded-md text-sm font-medium transition-all duration-200",
                            "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800",
                            "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white",
                            "data-[state=active]:shadow-sm",
                            "data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400",
                            "hover:text-gray-900 dark:hover:text-gray-200",
                            "border border-transparent data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-500 data-[state=active]:text-primary">
                              {type.typeCode}
                            </span>
                            <span className="text-gray-300 dark:text-gray-700">|</span>
                            <span className="font-medium">{type.typeName}</span>
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              <UserTable data={filteredNac} fetchNac={fetchNac} nacStatus={nacStatus} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}