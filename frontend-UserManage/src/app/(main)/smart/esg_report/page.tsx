"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Download, RefreshCw, Calendar, FileText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import client from "@/lib/axios/interceptors";
import { useDebounce } from "use-debounce";
import ESGDataTable from "./components/ESGTable/DataTable";
import ESGFilter from "./components/Filter/ESGFilter";

interface ESGMapFilter{
    car_infocode: string;
    car_band: string;
    car_tier: string;
    car_color: string;
}

export default function ESGReportPage() {
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 20,
        total: 0,
        totalPages: 0,
    });
    const [filterOptions, setFilterOptions] = useState<ESGFilter>({
        car_infocode: [],
        car_band: [],
        car_tier: [],
        car_color: [],
    });
    const [currentFilters, setCurrentFilters] = useState({
        car_infocode: "",
        car_band: "",
        car_tier: "",
        car_color: "",
    });
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [esgData, setESGData] = useState<EsgReport[]>([]);
    const [dateRange, setDateRange] = useState({
        startDate: "",
        endDate: "",
    });
    
    const [datatableSearch, setDatatableSearch] = useState("");
    const [debouncedDatatableSearch] = useDebounce(datatableSearch, 500);

    const fetchESGData = useCallback(async (
        pageIndex: number, 
        pageSize: number,
        startDate: string = "",
        endDate: string = "",
        filters = currentFilters,
        datatableSearchValue = ""
    ) => {
        if (status !== "authenticated" || !session?.user?.UserCode) return;
        if (loading) return;
  
        setLoading(true);
        setError(null);
  
        try {
            const response = await client.get<ApiResponse>(
                `/SmartBill_ESGQuery`,
                {
                    params: {
                        page: pageIndex + 1,
                        limit: pageSize,
                        startDate: startDate || undefined,
                        endDate: endDate || undefined,
                        car_infocode: filters.car_infocode || undefined,
                        car_band: filters.car_band || undefined,
                        car_tier: filters.car_tier || undefined,
                        car_color: filters.car_color || undefined,
                        search: datatableSearchValue || undefined,
                    },
                }
            );
  
            const data = response.data;
            const items = data.data || [];
            
            setESGData(items.map((item: any) => ({
                ...item,
                TotalCount: data.pagination?.total || 0
            })));
  
            const newPagination = {
                pageIndex: pageIndex,
                pageSize: pageSize,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 0,
            };
            setPagination(newPagination);
            
        } catch (err: any) {
            setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
            console.error("❌ Error loading ESG data:", err);
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    }, [status, session?.user?.UserCode, loading, currentFilters]);
    
    useEffect(() => {
        if (!initialLoading && debouncedDatatableSearch !== undefined) {
            fetchESGData(0, pagination.pageSize, dateRange.startDate, dateRange.endDate, currentFilters, debouncedDatatableSearch);
        }
    }, [debouncedDatatableSearch]);

    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const response = await client.get("SmartBill_ESG_Fetch_FilterOptions");
                const data = response.data;
                setFilterOptions(data);
            } catch (err) {
                console.error("Error fetching filter options:", err);
            }
        };
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        if (status === "authenticated" && session?.user?.UserCode) {
            fetchESGData(0, pagination.pageSize, dateRange.startDate, dateRange.endDate, currentFilters, debouncedDatatableSearch);
        }
    }, [status, session?.user?.UserCode, dateRange, currentFilters, debouncedDatatableSearch]);

    const handlePageChange = useCallback((newPageIndex: number) => {
        fetchESGData(newPageIndex, pagination.pageSize, dateRange.startDate, dateRange.endDate, currentFilters, debouncedDatatableSearch);
    }, [fetchESGData, pagination.pageSize, dateRange, currentFilters, debouncedDatatableSearch]);
    
    const handlePageSizeChange = useCallback((newPageSize: number) => {
        fetchESGData(0, newPageSize, dateRange.startDate, dateRange.endDate, currentFilters, debouncedDatatableSearch);
    }, [fetchESGData, dateRange, currentFilters, debouncedDatatableSearch]);
    
    const handleFilterChange = useCallback((filters: ESGMapFilter) => {
        const mappedFilters = {
            car_infocode: filters.car_infocode || "",
            car_band: filters.car_band || "",
            car_tier: filters.car_tier || "",
            car_color: filters.car_color || "",
        };

        setCurrentFilters(mappedFilters);
        fetchESGData(0, pagination.pageSize, dateRange.startDate, dateRange.endDate, mappedFilters, debouncedDatatableSearch);
    }, [fetchESGData, pagination.pageSize, dateRange, debouncedDatatableSearch]);

    const handleDatatableSearchChange = useCallback((searchValue: string) => {
        setDatatableSearch(searchValue);
    }, []);

    const handleRefresh = () => {
        setDateRange({ startDate: "", endDate: "" });
        setCurrentFilters({
            car_infocode: "",
            car_band: "",
            car_tier: "",
            car_color: "",
        });
        setDatatableSearch("");
        fetchESGData(0, pagination.pageSize, "", "", {
            car_infocode: "",
            car_band: "",
            car_tier: "",
            car_color: "",
        }, "");
    };

    const handleExport = async () => {
        // TODO: Export to Excel/PDF
        console.log("Export ESG Report");
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8 space-y-6">
                {/* Header Section */}
                <div className="bg-white dark:bg-gray-800 border-b-4 border-gray-900 dark:border-gray-100 shadow-sm">
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-900 dark:bg-gray-100 rounded-lg">
                                    <FileText className="h-6 w-6 text-white dark:text-gray-900" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        ESG PERFORMANCE REPORT
                                    </h1>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Environmental, Social & Governance Metrics • {pagination.total.toLocaleString()} รายการ
                                    </p>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExport}
                                    className="border-gray-300 dark:border-gray-600"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={loading}
                                    className="border-gray-300 dark:border-gray-600"
                                >
                                    <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Data Table Card */}
                <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                    <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                        รายงานรายละเอียด
                                    </CardTitle>
                                    <CardDescription className="text-sm mt-1">
                                        ข้อมูลการใช้งานรถยนต์และพลังงาน
                                    </CardDescription>
                                </div>
                            </div>

                            {/* Filter Button */}
                            <ESGFilter
                                filterOptions={filterOptions}
                                onFilterChange={handleFilterChange}
                                dateRange={dateRange}
                                onDateRangeChange={setDateRange}
                            />
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="p-4">
                            {error && (
                                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-500">
                                    <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                                        {error}
                                    </p>
                                </div>
                            )}

                            {initialLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin"></div>
                                        <div className="text-center">
                                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                กำลังโหลดข้อมูล
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                Loading ESG Report Data...
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <ESGDataTable 
                                    data={esgData} 
                                    loading={loading}
                                    pagination={{
                                        pageIndex: pagination.pageIndex,
                                        pageSize: pagination.pageSize,
                                    }}
                                    totalPages={pagination.totalPages > 0 ? pagination.totalPages : 1}
                                    totalRows={pagination.total || 0}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={handlePageSizeChange}
                                    searchValue={datatableSearch}
                                    onSearchChange={handleDatatableSearchChange}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}