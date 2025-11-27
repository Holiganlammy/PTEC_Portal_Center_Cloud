"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Download, RefreshCw, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import client from "@/lib/axios/interceptors";
import { useDebounce } from "use-debounce";
import SmartBillDataTable from "./components/SmartBillDataTable";
import SmartBillFilter from "./components/Filter/SmartBillFilter";

interface SmartBillFilter_Map{
    sbw_code: string,
    usercode: string,
    car_infocode: string,
    company: string,
    search?: string,
}

export default function SmartBillListPage() {
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 20,
        total: 0,
        totalPages: 0,
    });
    
    const [filterOptions, setFilterOptions] = useState<SmartBill_FilterOption>({
        sbw_code: [],
        usercode: [],
        car_infocode: [],
        company: [],
    });
    
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [smartBill, setSmartBill] = useState<SmartBillData[]>([]);
    
    const [currentFilters, setCurrentFilters] = useState({
        sbw_code: "",
        usercode: "",
        car_infocode: "",
        company: "",
        search: "",
    });

    const [datatableSearch, setDatatableSearch] = useState("");
    const [debouncedDatatableSearch] = useDebounce(datatableSearch, 500);

    const smartBillData = useCallback(async (
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
                `/SmartBill_Withdraw_List`,
                {
                    params: {
                        page: pageIndex + 1,
                        limit: pageSize,
                        sbw_code: filters.sbw_code || undefined,
                        usercode: filters.usercode || undefined,
                        car_infocode: filters.car_infocode || undefined,
                        company: filters.company || undefined,
                        search: datatableSearchValue || undefined,
                    },
                }
            );
  
            const data = response.data;         
            setSmartBill((data.data || []).map((item: any) => ({
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
            smartBillData(0, pagination.pageSize, currentFilters, debouncedDatatableSearch);
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
            smartBillData(0, pagination.pageSize, currentFilters, debouncedDatatableSearch);
        }
    }, [status, session?.user?.UserCode, currentFilters, debouncedDatatableSearch]);


    const handlePageChange = useCallback((newPageIndex: number) => {
        smartBillData(newPageIndex, pagination.pageSize, currentFilters, debouncedDatatableSearch);
    }, [smartBillData, pagination.pageSize, currentFilters, debouncedDatatableSearch]);

    const handlePageSizeChange = useCallback((newPageSize: number) => {
        smartBillData(0, newPageSize, currentFilters, debouncedDatatableSearch);
    }, [smartBillData, currentFilters, debouncedDatatableSearch]);

    const handleFilterChange = useCallback((filters: SmartBillFilter_Map) => {
        const mappedFilters = {
            sbw_code: filters.sbw_code || "",
            usercode: filters.usercode || "",
            car_infocode: filters.car_infocode || "",
            company: filters.company || "",
            search: "",
        };

        setCurrentFilters(mappedFilters);
        smartBillData(0, pagination.pageSize, mappedFilters, debouncedDatatableSearch);
    }, [smartBillData, pagination.pageSize, debouncedDatatableSearch]);

    const handleDatatableSearchChange = useCallback((searchValue: string) => {
        setDatatableSearch(searchValue);
    }, []);

    const handleRefresh = () => {
        setCurrentFilters({
            sbw_code: "",
            usercode: "",
            car_infocode: "",
            company: "",
            search: "",
        });
        setDatatableSearch("");
        smartBillData(0, pagination.pageSize, {
            sbw_code: "",
            usercode: "",
            car_infocode: "",
            company: "",
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
                                    SmartBill List Table
                                </CardTitle>
                                <CardDescription>
                                    Manage and monitor all SmartBills registered in your system ({pagination.total.toLocaleString()} total)
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

                            <SmartBillFilter
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
                                <SmartBillDataTable 
                                    data={smartBill} 
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