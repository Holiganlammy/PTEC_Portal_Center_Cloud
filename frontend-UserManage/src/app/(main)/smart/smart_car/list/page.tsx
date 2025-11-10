"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Download, RefreshCw, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import SmartCarDataTable from "./components/SmartCarDataTable";
// import AssetsFilterForm from "./components/FilterForm";
import { useSession } from "next-auth/react";
import client from "@/lib/axios/interceptors";
import { useDebounce } from "use-debounce";
import SmartCarFilter from "./components/Filter/SmartCarFillter";

export default function SmartCarListPage() {
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 20,
        total: 0,
        totalPages: 0,
    });
    
    const [filterOptions, setFilterOptions] = useState<SmartCar_FilterOption>({
        sb_codes: [],
        usercodes: [],
        car_infocodes: [],
        car_categories: [],
        sb_statuses: [],
    });
    
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [smartCar, setSmartCar] = useState<SmartCarData[]>([]);
    
    const [currentFilters, setCurrentFilters] = useState({
        sb_codes: "",
        usercodes: "",
        car_infocodes: "",
        car_categories: "",
        sb_statuses: "",
        search: "",
    });

    const [datatableSearch, setDatatableSearch] = useState("");
    const [debouncedDatatableSearch] = useDebounce(datatableSearch, 500);

    const smartCarData = useCallback(async (
        pageIndex: number, 
        pageSize: number,
        filters = currentFilters,
        datatableSearchValue = ""
    ) => {
        if (status !== "authenticated" || !session?.user?.UserCode) return;
        if (loading) return;
  
        setLoading(true);
        setError(null);
  
        try {
            const response = await client.get<ApiResponse>(
                `/SmartBill_SelectHeaders`,
                {
                    params: {
                        page: pageIndex + 1,
                        limit: pageSize,
                        sb_code: filters.sb_codes || undefined,
                        user_code: filters.usercodes || undefined,
                        car_info_code: filters.car_infocodes || undefined,
                        car_category_id: filters.car_categories || undefined,
                        status: filters.sb_statuses || undefined,
                        search: datatableSearchValue || undefined,
                    },
                }
            );
  
            const data = response.data;         
            setSmartCar((data.data || []).map((item: any) => ({
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
            console.error("❌ Error loading assets:", err);
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    }, [status, session?.user?.UserCode, loading, currentFilters]);

    useEffect(() => {
        if (!initialLoading && debouncedDatatableSearch !== undefined) {
            smartCarData(0, pagination.pageSize, currentFilters, debouncedDatatableSearch);
        }
    }, [debouncedDatatableSearch]);

    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const response = await client.get("SmartBill_Fetch_FilterOptions");
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
            smartCarData(0, pagination.pageSize, currentFilters, debouncedDatatableSearch);
        }
    }, [status, session?.user?.UserCode, currentFilters, debouncedDatatableSearch]);


    const handlePageChange = useCallback((newPageIndex: number) => {
        smartCarData(newPageIndex, pagination.pageSize, currentFilters, debouncedDatatableSearch);
    }, [smartCarData, pagination.pageSize, currentFilters, debouncedDatatableSearch]);

    const handlePageSizeChange = useCallback((newPageSize: number) => {
        smartCarData(0, newPageSize, currentFilters, debouncedDatatableSearch);
    }, [smartCarData, currentFilters, debouncedDatatableSearch]);

    const handleFilterChange = useCallback((filters: any) => {
        const mappedFilters = {
            sb_codes: filters.sb_code || "",
            usercodes: filters.usercode || "",
            car_infocodes: filters.car_infocode || "",
            car_categories: filters.car_category || "",
            sb_statuses: filters.sb_status || "",
            search: "",
        };

        setCurrentFilters(mappedFilters);
        smartCarData(0, pagination.pageSize, mappedFilters, debouncedDatatableSearch);
    }, [smartCarData, pagination.pageSize, debouncedDatatableSearch]);

    const handleDatatableSearchChange = useCallback((searchValue: string) => {
        setDatatableSearch(searchValue);
    }, []);

    const handleRefresh = () => {
        setCurrentFilters({
            sb_codes: "",
            usercodes: "",
            car_infocodes: "",
            car_categories: "",
            sb_statuses: "",
            search: "",
        });
        setDatatableSearch("");
        smartCarData(0, pagination.pageSize, {
            sb_codes: "",
            usercodes: "",
            car_infocodes: "",
            car_categories: "",
            sb_statuses: "",
            search: "",
        }, "");
    };
    const handleExport = async () => {

    }    
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8 space-y-8">
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <div>
                                <CardTitle className="text-xl font-bold text-primary dark:text-white">
                                    SmartCar List Table
                                </CardTitle>
                                <CardDescription>
                                    Manage and monitor all SmartCars registered in your system ({pagination.total.toLocaleString()} total)
                                </CardDescription>
                            </div>

                            <div className="flex flex-wrap gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs sm:text-sm cursor-pointer"
                                    onClick={handleExport}
                                >
                                    <Download className="h-4 w-4 mr-2" /> Export
                                </Button>

                                <Button
                                    className="text-xs sm:text-sm cursor-pointer"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRefresh}
                                >
                                    <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> 
                                    Refresh
                                </Button>
                            </div>

                            <SmartCarFilter
                                filterOptions={filterOptions}
                                onFilterChange={handleFilterChange}
                            />
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                            {error && (
                                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {initialLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading SmartCar List...</p>
                                    </div>
                                </div>
                            ) : (
                                <SmartCarDataTable 
                                    data={smartCar} 
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