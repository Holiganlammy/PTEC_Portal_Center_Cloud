"use client"
import CustomSelect from "@/components/SelectSection/SelectSearch"
import { FormField, Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Filter, Calendar as CalendarIcon, X } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useDebounce } from "use-debounce"
import { z } from "zod"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { cn } from "@/lib/utils"

const SelectSchema = z.object({
   car_infocode: z.string(),
   car_band: z.string(),
   car_tier: z.string(),
   car_color: z.string(),
})
type SelectType = z.infer<typeof SelectSchema>

interface DateRange {
    startDate: string;
    endDate: string;
}

interface ESGFilterProps {
    filterOptions: ESGFilter;
    onFilterChange: (filters: SelectType) => void;
    dateRange: DateRange;
    onDateRangeChange: (dateRange: DateRange) => void;
}
    
export default function ESGFilter({
   filterOptions,
   onFilterChange,
   dateRange,
   onDateRangeChange
}: ESGFilterProps) {
    const isFirstRender = useRef(true)
    const [dateModalOpen, setDateModalOpen] = useState(false)
    const [startDate, setStartDate] = useState<Date | undefined>(
        dateRange.startDate ? new Date(dateRange.startDate) : undefined
    )
    const [endDate, setEndDate] = useState<Date | undefined>(
        dateRange.endDate ? new Date(dateRange.endDate) : undefined
    )
    
    const form = useForm<SelectType>({
        resolver: zodResolver(SelectSchema),
        defaultValues: {
            car_infocode: "",
            car_band: "",
            car_tier: "",
            car_color: "",
        },
    })

    const [watchCarInfocode, watchCarBand, watchCarTier, watchCarColor] = form.watch([
      "car_infocode",
      "car_band",
      "car_tier",
      "car_color"
    ])

    const [debouncedCarInfocode] = useDebounce(watchCarInfocode, 750)
    const [debouncedCarBand] = useDebounce(watchCarBand, 750)
    const [debouncedCarTier] = useDebounce(watchCarTier, 750)
    const [debouncedCarColor] = useDebounce(watchCarColor, 750)

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        const newFilters = {
            car_infocode: debouncedCarInfocode || "",
            car_band: debouncedCarBand || "",
            car_tier: debouncedCarTier || "",
            car_color: debouncedCarColor || "",
        }
        if (onFilterChange) {
            onFilterChange(newFilters)
        }
    }, [debouncedCarInfocode, debouncedCarBand, debouncedCarTier, debouncedCarColor])

    const hasActiveDateRange = dateRange.startDate || dateRange.endDate

    const handleApplyDate = () => {
        onDateRangeChange({
            startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
            endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
        })
        setDateModalOpen(false)
    }

    const handleClearDate = () => {
        setStartDate(undefined)
        setEndDate(undefined)
        onDateRangeChange({ startDate: "", endDate: "" })
    }
    
    return (
        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <Filter className="h-4 w-4" />
                    <span>กรองข้อมูล</span>
                </div>

                {/* Date Picker Button */}
                <Dialog open={dateModalOpen} onOpenChange={setDateModalOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "border-2",
                                hasActiveDateRange && "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                            )}
                        >
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {hasActiveDateRange ? "ช่วงเวลาที่เลือก" : "เลือกช่วงเวลา"}
                            {hasActiveDateRange && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                                    Active
                                </span>
                            )}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                เลือกช่วงเวลา
                            </DialogTitle>
                            <DialogDescription>
                                กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุดสำหรับรายงาน
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            {/* Start Date */}
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-semibold text-gray-900 dark:text-white">
                                    วันที่เริ่มต้น
                                </label>
                                <Popover modal>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "justify-start text-left font-normal border-2 h-auto py-3",
                                                !startDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? (
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">
                                                        {format(startDate, "d MMMM yyyy", { locale: th })}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {format(startDate, "EEEE", { locale: th })}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span>คลิกเพื่อเลือกวันที่</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={setStartDate}
                                            initialFocus
                                            locale={th}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* End Date */}
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-semibold text-gray-900 dark:text-white">
                                    วันที่สิ้นสุด
                                </label>
                                <Popover modal>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "justify-start text-left font-normal border-2 h-auto py-3",
                                                !endDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? (
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">
                                                        {format(endDate, "d MMMM yyyy", { locale: th })}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {format(endDate, "EEEE", { locale: th })}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span>คลิกเพื่อเลือกวันที่</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={setEndDate}
                                            initialFocus
                                            locale={th}
                                            disabled={(date) =>
                                                startDate ? date < startDate : false
                                            }
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Preview */}
                        {(startDate || endDate) && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    ช่วงเวลาที่เลือก:
                                </p>
                                <p className="text-base font-semibold text-gray-900 dark:text-white">
                                    {startDate ? format(startDate, "d MMM yyyy", { locale: th }) : "-"} 
                                    {" ถึง "}
                                    {endDate ? format(endDate, "d MMM yyyy", { locale: th }) : "-"}
                                </p>
                            </div>
                        )}

                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={handleClearDate}
                                className="border-2"
                            >
                                <X className="h-4 w-4 mr-2" />
                                ล้าง
                            </Button>
                            <Button onClick={handleApplyDate}>
                                ใช้งาน
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(form.getValues)}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
                >
                    <div className="w-full">
                        <FormField 
                            name="car_infocode" 
                            control={form.control} 
                            render={({ field }) => (
                                <CustomSelect
                                    field={field}
                                    formLabel="ทะเบียนรถ"
                                    placeholder="เลือกทะเบียนรถ"
                                    options={filterOptions.car_infocode}
                                />
                            )} 
                        />
                    </div>

                    <div className="w-full">
                        <FormField 
                            name="car_band" 
                            control={form.control} 
                            render={({ field }) => (
                                <CustomSelect
                                    field={field}
                                    formLabel="ยี่ห้อรถ"
                                    placeholder="เลือกยี่ห้อรถ"
                                    options={filterOptions.car_band}
                                />
                            )} 
                        />
                    </div>

                    <div className="w-full">
                        <FormField 
                            name="car_tier" 
                            control={form.control} 
                            render={({ field }) => (
                                <CustomSelect
                                    field={field}
                                    formLabel="รุ่นรถ"
                                    placeholder="เลือกรุ่นรถ"
                                    options={filterOptions.car_tier}
                                />
                            )} 
                        />
                    </div>

                    <div className="w-full">
                        <FormField 
                            name="car_color" 
                            control={form.control} 
                            render={({ field }) => (
                                <CustomSelect
                                    field={field}
                                    formLabel="สีรถ"
                                    placeholder="เลือกสีรถ"
                                    options={filterOptions.car_color}
                                />
                            )} 
                        />
                    </div>
                </form>
            </Form>
        </div>
    )
}