"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Download, RefreshCw, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AssetsTable from "./components/AssetsTable";
import AssetsFilterForm from "./components/FilterForm";
import ImportDialog from "./components/import/ImportData";
import { useSession } from "next-auth/react";
import client from "@/lib/axios/interceptors";
import { getAutoData } from "../list_asset_counted/service/documentService";
import { useDebounce } from "use-debounce";
import { url } from "inspector";

export default function AssetPage() {
    const [typeCode, setTypeCode] = useState<Assets_TypeGroup[]>([]);
    const [activeType, setActiveType] = useState<string>("PTEC");
    
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 20,
        total: 0,
        totalPages: 0,
    });
    
    const [filterOptions, setFilterOptions] = useState<FilterOption>({
        codes: [],
        names: [],
        owners: [],
        groups: [],
        locations: [],
    });
    
    const { data: session, status } = useSession();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [currentFilters, setCurrentFilters] = useState({
        code: "",
        name: "",
        owner: "",
        group: "",
        location: "",
        search: "",
    });

    const [datatableSearch, setDatatableSearch] = useState("");
    const [debouncedDatatableSearch] = useDebounce(datatableSearch, 500);

    // Import Dialog States
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [users, setUsers] = useState<DataUserList[]>([]);
    const [assetsTypeGroup, setAssetsTypeGroup] = useState<Assets_TypeGroup[]>([]);

    const loadAssets = useCallback(async (
        pageIndex: number, 
        pageSize: number,
        selectedType = activeType, 
        filters = currentFilters,
        datatableSearchValue = ""
    ) => {
        if (status !== "authenticated" || !session?.user?.UserCode) return;
        if (loading) return;
  
        setLoading(true);
        setError(null);
  
        try {
            const response = await client.get<ApiResponse>(
                `/FA_Control_Fetch_Assets`,
                {
                    params: {
                        usercode: session.user.UserCode,
                        typeCode: selectedType,
                        page: pageIndex + 1,
                        limit: pageSize,
                        code: filters.code || undefined,
                        name: filters.name || undefined,
                        owner: filters.owner || undefined,
                        group: filters.group || undefined,
                        location: filters.location || undefined,
                        search: datatableSearchValue || undefined,
                    },
                }
            );
  
            const data = response.data;         
            setAssets(data.data || []);
  
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
    }, [status, session?.user?.UserCode, loading, activeType, currentFilters]);

    useEffect(() => {
        if (!initialLoading && debouncedDatatableSearch !== undefined) {
            loadAssets(0, pagination.pageSize, activeType, currentFilters, debouncedDatatableSearch);
        }
    }, [debouncedDatatableSearch]);

    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const response = await client.get("FA_Control_Fetch_Assets_FilterOptions");
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
            loadAssets(0, pagination.pageSize, activeType);
        }
    }, [status, session?.user?.UserCode, activeType]);

    useEffect(() => {
        (async () => {
            try {
                const dataOther = await getAutoData();
                const groupData = dataOther?.find((d) => d.key === "typeGroup")?.data || [];
    
                const groupedTypes = groupData.map((g: Assets_TypeGroup) => {
                    const count = assets.filter(a => a.typeCode === g.typeCode).length;
                    return { ...g, count };
                });
    
                setTypeCode(groupedTypes);
                setAssetsTypeGroup(groupData);
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

    // Load users for validation
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await client.get("/users");
                setUsers(response.data || []);
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        };
        fetchUsers();
    }, []);

    const handlePageChange = useCallback((newPageIndex: number) => {
        loadAssets(newPageIndex, pagination.pageSize, activeType, currentFilters, debouncedDatatableSearch);
    }, [loadAssets, pagination.pageSize, activeType, currentFilters, debouncedDatatableSearch]);

    const handlePageSizeChange = useCallback((newPageSize: number) => {
        loadAssets(0, newPageSize, activeType, currentFilters, debouncedDatatableSearch);
    }, [loadAssets, activeType, currentFilters, debouncedDatatableSearch]);

    const handleFilterChange = useCallback((filters: any) => {
        setCurrentFilters(filters);
        loadAssets(0, pagination.pageSize, activeType, filters, debouncedDatatableSearch);
    }, [loadAssets, pagination.pageSize, activeType, debouncedDatatableSearch]);

    const handleDatatableSearchChange = useCallback((searchValue: string) => {
        setDatatableSearch(searchValue);
    }, []);

    const handleRefresh = () => {
        setCurrentFilters({
            code: "",
            name: "",
            owner: "",
            group: "",
            location: "",
            search: "",
        });
        setDatatableSearch("");
        loadAssets(0, pagination.pageSize, activeType, {
            code: "",
            name: "",
            owner: "",
            group: "",
            location: "",
            search: "",
        }, "");
    };

    const handleExport = () => {
        console.log("Exporting assets...", assets);
        // TODO: Implement export functionality
    };

    const handleImportClick = () => {
        setImportDialogOpen(true);
    };

    const handleImportSuccess = () => {
        // Refresh data after successful import
        loadAssets(pagination.pageIndex, pagination.pageSize, activeType, currentFilters, debouncedDatatableSearch);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8 space-y-8">
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <div>
                                <CardTitle className="text-xl font-bold text-primary dark:text-white">
                                    All Assets Registration
                                </CardTitle>
                                <CardDescription>
                                    Manage and monitor all assets registered in your system ({pagination.total.toLocaleString()} total)
                                </CardDescription>
                            </div>

                            <div className="flex flex-wrap gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs sm:text-sm cursor-pointer"
                                    onClick={handleImportClick}
                                >
                                    <Upload className="h-4 w-4 mr-2" /> Import
                                </Button>

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

                            <AssetsFilterForm
                                typeCode={typeCode}
                                activeType={activeType}
                                setActiveType={setActiveType}
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
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading assets...</p>
                                    </div>
                                </div>
                            ) : (
                                <AssetsTable 
                                    data={assets} 
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

            {/* Import Dialog */}
            <ImportDialog
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
                users={users}
                assetsTypeGroup={assetsTypeGroup}
                userCode={session?.user?.UserCode || ""}
                onSuccess={handleImportSuccess}
            />
        </div>
    );
}