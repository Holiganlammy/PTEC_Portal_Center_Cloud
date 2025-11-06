"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import { getAutoDataAssetCounted, getAutoData } from "../../service/documentService";
import AssetsCountTable from "../../AssetsCountedTable/AssetsCountedTable";
import FilterForm from "./FilterForm";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { exportToExcel } from "../../service/export";
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getAutoData as FetchData } from "@/app/(main)/fa_control/forms/service/faService";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AssetsCountedListClient() {
  const { data: session, status } = useSession({
  required: false,
});
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [typeGroup, setTypeGroup] = useState<Assets_TypeGroup[]>([]);
  const [listDescription, setListDescription] = useState<PeriodDescription[]>([]);
  const [typeString, setTypeString] = useState<string | null>('PTEC');
  const [assetsFetch, setAssetsFetch] = useState<CountAssetRow[]>([]);
  const [userFetch, setUserFetch] = useState<DataAsset[]>([]);
  const [newValue, setNewValue] = useState<string>('');
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("CountAssetRow");
      return saved
        ? JSON.parse(saved)
        : {
          Code: "",
          Name: "",
          BranchID: "",
          OwnerID: "",
          Position: "",
          typeCode: "",
          filter: "",
        };
    }
    return {
      Code: "",
      Name: "",
      BranchID: "",
      OwnerID: "",
      Position: "",
      typeCode: "",
      filter: "",
    };
  });

const fetchAssetsCounted = useCallback(async () => {
  if (session) {
    try {
      const dataUser = await FetchData(session?.user.UserCode,session?.user.branchid);
      console.log("🔍 Debug dataUser:", dataUser);

      const myAssets = dataUser?.find((d) => d.key === "assets")?.data || [];
      console.log("✅ My assets:", myAssets);
      setUserFetch(myAssets);

      const dataOther = await getAutoData();
      setTypeGroup(dataOther?.find((d) => d.key === "typeGroup")?.data || []);
      const dataNAC: PeriodDescription[] = await getAutoDataAssetCounted(Number(newValue));
      // ------------------------------
      // ✅ Filter รอบตรวจนับเฉพาะของตัวเอง
      // ------------------------------
      const filteredRounds = dataNAC.filter((round) => {
        const branchMatch =
          round.BranchID === session?.user.branchid ||
          round.BranchID === myAssets[0]?.BranchID; // เผื่อ user ไม่มี branch ใน session
        const personMatch =
          round.personID === session?.user.UserCode ||
          myAssets.some((a: { OwnerID: number | undefined; }) => a.OwnerID === session?.user.depid);

        return branchMatch || personMatch;
      });
      console.log("🎯 Filtered rounds:", filteredRounds);
      setListDescription(filteredRounds);

      setIsChecking(false);
    } catch (error) {
      console.error("❌ Error fetching NAC:", error);
      setIsChecking(false);
    }
  }
}, []);

  useEffect(() => {
    setIsChecking(true);
    fetchAssetsCounted();
  }, []);

  const filteredAssets = useMemo(() => {
    return assetsFetch.filter((asset) => {
      if (typeString && asset.typeCode !== typeString) return false;
      if (filters.Code && !asset.Code?.toString().toLowerCase().includes(filters.Code.toLowerCase())) return false;
      if (filters.Name && !asset.Name?.toString().toLowerCase().includes(filters.Name.toLowerCase())) return false;
      if (filters.BranchID && !asset.BranchID?.toString().toLowerCase().includes(filters.BranchID.toLowerCase())) return false;
      if (filters.OwnerID && !asset.OwnerID?.toString().toLowerCase().includes(filters.OwnerID.toLowerCase())) return false;
      if (filters.Position && !asset.Position?.toString().toLowerCase().includes(filters.Position.toLowerCase())) return false;
      if (filters.typeCode && asset.typeCode !== filters.typeCode) return false;
      if (filters.filter && filters.filter.trim()) {
        const searchTerm = filters.filter.toLowerCase();
        const searchFields = [
          asset.Code?.toString(),
          asset.Name?.toString(),
          asset.BranchID?.toString(),
          asset.OwnerID?.toString(),
          asset.Position?.toString(),
          asset.typeCode?.toString()
        ].filter(Boolean).map(field => field!.toLowerCase());
        
        const hasMatch = searchFields.some(field => field.includes(searchTerm));
        if (!hasMatch) return false;
      }
      
      return true;
    });
  }, [assetsFetch, filters, typeString]);

  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    localStorage.setItem("CountAssetRow", JSON.stringify(newFilters));
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
                  Assets Counted
                </CardTitle>
                <CardDescription>
                  Manage and monitor all assets counted in your system
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">

                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-auto lg:w-[500px] justify-between"
                    >
                      {newValue
                        ? listDescription.find((value) => value.PeriodID === newValue)?.Description
                        : "ค้นหาคำอธิบายรอบตรวจนับ..."}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto lg:w-[500px] p-0">
                    <Command>
                      <CommandInput placeholder="ค้นหาคำอธิบายรอบตรวจนับ..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No data.</CommandEmpty>
                        <CommandGroup>
                          {listDescription && listDescription.map((description, index) => (
                            <CommandItem
                              key={description.PeriodID}
                              value={description.PeriodID}
                              onSelect={async (currentValue) => {
                                setNewValue(currentValue);
                                const dataNAC: CountAssetRow[] = await getAutoDataAssetCounted(Number(currentValue));
                                const myAssetIds = userFetch.map(asset => asset.Code);
                                const filtered = dataNAC.filter(res => myAssetIds.includes(res.Code || ""));
                                setAssetsFetch(filtered);
                                setOpen(false);
                                console.log("🆕 Selected PeriodID:", currentValue);
                              }}
                            >
                              {description.Description}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  newValue === description.Description ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm cursor-pointer"
                  onClick={() => exportToExcel(filteredAssets)}
                >
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>

                <Button
                  className="text-xs sm:text-sm cursor-pointer"
                  variant="outline"
                  size="sm"
                  onClick={fetchAssetsCounted}
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <FilterForm
                  filters={filters}
                  filteredAssets={filteredAssets}
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
                            "border border-transparent data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-700 cursor-pointer",
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
              <AssetsCountTable
                data={filteredAssets}
                fetchAssetsCounted={fetchAssetsCounted}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}