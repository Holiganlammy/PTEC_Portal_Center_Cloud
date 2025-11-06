"use client"
import { BookImage, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useRef, useState } from "react"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import CustomSelect from "@/components/SelectSection/SelectSearch"
import { useDebounce } from "use-debounce"
import client from "@/lib/axios/interceptors"

const SelectSchema = z.object({
   code: z.string(),
   name: z.string(),
   owner: z.string(),
   group: z.string(),
   location: z.string(),
   search: z.string().optional(),
})
type SelectType = z.infer<typeof SelectSchema>

export function EbookFilterBar({
   typeCode,
   activeType,
   setActiveType,
   filterOptions,
   onFilterChange
}: {
   typeCode: Assets_TypeGroup[];
   activeType: string;
   setActiveType: (v: string) => void;
   filterOptions: FilterOption;
   onFilterChange: (filters: SelectType) => void;
}) {

   const isFirstRender = useRef(true)
   const form = useForm<SelectType>({
      resolver: zodResolver(SelectSchema),
      defaultValues: {
         code: "",
         name: "",
         owner: "",
         group: "",
         location: "",
         search: "",
      },
   })
   const [watchCode, watchName, watchOwner, watchGroup, watchLocation, watchSearch] = form.watch([
      "code",
      "name",
      "owner",
      "group",
      "location",
      "search"
   ])

   const [debouncedCode] = useDebounce(watchCode, 750)
   const [debouncedName] = useDebounce(watchName, 750)
   const [debouncedOwner] = useDebounce(watchOwner, 750)
   const [debouncedGroup] = useDebounce(watchGroup, 750)
   const [debouncedLocation] = useDebounce(watchLocation, 750)
   const [debouncedSearch] = useDebounce(watchSearch, 500)

   
   // const loadOptionsForSelect = useMemo(() => {
   //   return async (input: string): Promise<{ value: string; label: string }[]> => {
   //     const allCodes = filterOptions.codes || [];
   //     const filtered = input.trim() === ""
   //       ? allCodes
   //       : allCodes.filter((opt) => 
   //           opt.label.toLowerCase().includes(input.toLowerCase()) ||
   //           opt.value.toLowerCase().includes(input.toLowerCase())
   //         );
   
   //     return filtered;
   //   };
   // }, [filterOptions.codes]);
   const loadOptionsForSelect = async (input: string, offset?: number, pageSize?: number) => {
      const params: any = { search: input || "" };

      // ✅ ส่ง offset และ pageSize เฉพาะกรณี infinite scroll เท่านั้น
      if (typeof offset === "number" && typeof pageSize === "number") {
         params.offset = offset;
         params.pageSize = pageSize;
      }

      const res = await client.get("/FA_Control_Fetch_Assets_FilterCode", { params });

      return Array.isArray(res.data) ? res.data : (res.data?.recordset ?? []);
   };

   useEffect(() => {
      if (isFirstRender.current) {
         isFirstRender.current = false
         return
      }
      const newFilters = {
         code: debouncedCode || "",
         name: debouncedName || "",
         owner: debouncedOwner || "",
         group: debouncedGroup || "",
         location: debouncedLocation || "",
         search: debouncedSearch || "",
      }
      if (onFilterChange) {
         onFilterChange(newFilters)
      }
   }, [debouncedCode, debouncedName, debouncedOwner, debouncedGroup, debouncedLocation, debouncedSearch])

   const onSubmit = (value: SelectType) => {
      console.log("Form submitted:", value)
   }

   return (
      <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-slate-200 shadow-sm mb-10">
         <div className="max-w-[1600px] mx-auto px-6 py-4 space-y-3">

            {/* 🧭 Title */}
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-black to-black flex items-center justify-center text-white shadow-sm">
                  <BookImage className="w-4 h-4" />
               </div>
               <h2 className="text-lg md:text-xl font-bold text-slate-900">
                  E-Book ทรัพย์สิน
               </h2>
            </div>

            {/* 🎛️ Filters */}
            <Form {...form}>
               <form
                  onSubmit={form.handleSubmit(form.getValues)}
                  className=""
               >
                  {/* Responsive Grid Layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                     {/* Code Filter */}
                     <div className="w-full">
                        <FormField 
                           name="code" 
                           control={form.control} 
                           render={({ field }) => (
                              <CustomSelect
                                 field={field}
                                 formLabel="Code"
                                 placeholder="Code"
                                 loadOptions={loadOptionsForSelect}
                                 enableInfiniteScroll={true}
                              />
                        )} />
                     </div>
                     
                     {/* Name Filter */}
                     <div className="w-full">
                        <FormField 
                           name="name" 
                           control={form.control} 
                           render={({ field }) => (
                           <CustomSelect
                              field={field}
                              formLabel="Name"
                              placeholder="Name"
                              options={filterOptions.names}
                           />
                     )} />
                     </div>

                     {/* Owner Code Filter */}
                     <div className="w-full">
                        <FormField 
                           name="owner" 
                           control={form.control} 
                           render={({ field }) => (
                              <CustomSelect
                                 field={field}
                                 formLabel="Owner"
                                 placeholder="Owner"
                                 options={filterOptions.owners}
                              />
                        )} />
                     </div>

                     {/* Asset Group Filter */}
                     <div className="w-full">
                        <FormField 
                           name="group" 
                           control={form.control} 
                           render={({ field }) => (
                              <CustomSelect
                                 field={field}
                                 formLabel="Group"
                                 placeholder="Group"
                                 options={filterOptions.groups}
                              />
                        )} />
                     </div>

                     {/* Location Filter */}
                     <div className="w-full">
                        <FormField 
                           name="location" 
                           control={form.control} 
                           render={({ field }) => (
                              <CustomSelect
                                 field={field}
                                 formLabel="Location"
                                 placeholder="Location"
                                 options={filterOptions.locations}
                              />
                        )} />
                     </div>
                  </div>

                  {/* 🧩 Tabs Filter */}
                  <div className="pt-2 lg:justify-between border-t border-slate-100 lg:flex gap-3">
                     <Tabs value={activeType} onValueChange={setActiveType}>
                        <TabsList className="flex mt-[30px] flex-wrap gap-2 bg-slate-100/60 border border-slate-200 rounded-full p-1 shadow-inner overflow-x-auto">
                           {typeCode.length > 0 ? (
                              typeCode.map((t) => (
                                 <TabsTrigger
                                    key={t.typeGroupID}
                                    value={t.typeCode}
                                    className={cn(
                                       "relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
                                       "data-[state=active]:bg-gradient-to-r data-[state=active]:from-black data-[state=active]:to-black data-[state=active]:text-white data-[state=active]:shadow-md",
                                       "data-[state=inactive]:text-slate-600 hover:bg-white hover:text-teal-600"
                                    )}
                                 >
                                    {t.typeName}
                                 </TabsTrigger>
                              ))
                           ) : (
                              <div className="px-4 py-2 text-sm text-slate-500">กำลังโหลด...</div>
                           )}
                        </TabsList>
                     </Tabs>
                     {/* Search */}
                     <div className="mt-5 w-full lg:mt-0 lg:w-[50%]">
                        <FormField 
                           name="search" 
                           control={form.control} 
                           render={({ field }) => (
                              <FormItem className="relative mt-2">
                                 <FormLabel>Search</FormLabel>
                                 <FormControl>
                                    <Input
                                       {...field}
                                       placeholder="Search for assets... (Code, Name, Serial No, Owner, Status Asset)"
                                       className="w-full pr-10"
                                    />
                                 </FormControl>
                                 {watchSearch !== debouncedSearch && (
                                    <div className="absolute right-3 top-[70%] -translate-y-1/2">
                                       <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                                    </div>
                                 )}
                              </FormItem>
                           )} 
                        />
                     </div>
                  </div>
               </form>
            </Form>
         </div>
      </div>
   )
}