'use client'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowDownIcon, CalendarIcon, CirclePlus, Router, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, set } from "date-fns";
import { useEffect, useState } from "react";
import client from "@/lib/axios/interceptors";
import dataConfig from "@/config/config";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import {
   Command,
   CommandInput,
   CommandGroup,
   CommandItem,
   CommandEmpty,
} from "@/components/ui/command";
import SubmitSuccess from "@/components/SubmitAlert/AlertSubmitSuccess/SubmitSuccess";
import { useRouter } from "next/navigation";
import TimeWheelPicker from "../../../../../../../../components/TimeWheel/Time"
import SubmitFailed from "@/components/SubmitAlert/AlertSubmitFailed/SubmitFailed";


interface DialogSubmitReservationProps {
   open: boolean;
   setOpen: (open: boolean) => void;
   car: CarList
   status?: number;
}

export function DialogSubmitReservation({ open, setOpen, car, status }: DialogSubmitReservationProps) {
   const router = useRouter();
   const { data: session } = useSession({
  required: false,
});
   const [allCarsData, setAllCarsData] = useState<CarType[]>([]);
   const [userData, setUserData] = useState<UserData[]>([]);
   const [selectedUser, setSelectedUser] = useState<{ UserID: string; note: string }>({ UserID: "", note: "" });
   const [showSuccessAlert, setShowSuccessAlert] = useState(false);
   const [showErrorAlert, setShowErrorAlert] = useState(false);
   const [errorTitle, setErrorTitle] = useState("");
   const [errorMessage, setErrorMessage] = useState("");
   const today = new Date();
   today.setHours(0, 0, 0, 0);
   const formatDatetimeThai = (date: Date, Thai: boolean = false) => {
      if (Thai) {
         return format(date, "dd-MM-yyyy HH:mm:ss");
      }
      return format(date, "yyyy-MM-dd HH:mm:ss");
   };
   const formatForSQLWithTZ = (date: Date) => {
      return format(date, "yyyy-MM-dd'T'HH:mm:ssxxx");
   };
   useEffect(() => {
      const fetchData = async () => {
         try {
            const [carsRes, userRes] = await Promise.all([
               client.get(`/reservation/reservation_get_list`, {
                  method: 'GET',
                  headers: dataConfig().header
               }),
               client.get(`/users`, {
                  method: 'GET',
                  headers: dataConfig().header
               })
            ]);

            setAllCarsData(carsRes.data);
            setUserData(userRes.data);
         } catch (error) {
            console.error("โหลดข้อมูลล้มเหลว:", error);
         }
      };

      fetchData();
   }, [car]);

   const formSchema = z.object({
      Firstname: z.string().min(2, "Firstname must be 2+ characters"),
      Lastname: z.string().min(2, "Lastname "),
      SelectedCarId: z.string().min(1, "กรุณาเลือกรถ"),
      StartDate: z.date({
         required_error: "ใส่วันที่เริ่มต้นการจอง",
      }),
      EndDate: z.date({
         required_error: "ใส่วันที่สิ้นสุดการจอง",
      }),
      StartTime: z.string().min(1, "กรุณาเลือกเวลาเริ่มต้น"),
      EndTime: z.string().min(1, "กรุณาเลือกเวลาสิ้นสุด"),
      ReservationDetails: z.string().min(10, "Reservation Details must be 10+ characters"),
      destination: z.string().min(2, "Destination must be 2+ characters"),
      Attendees: z.array(z.object({
         UserID: z.string(),
         note: z.string().optional()
      })).optional(),
      reason_name: z.string().min(2, "Reason must be 2+ characters"),
   })
      .refine((data) => {
         return data.EndDate >= data.StartDate;
      }, {
         message: "End date must be equal to or after start date",
         path: ["EndDate"],
      })
      .refine((data) => {
         if (data.StartDate && data.EndDate && data.StartTime && data.EndTime) {
            const start = new Date(data.StartDate);
            const end = new Date(data.EndDate);

            const [sh, sm] = data.StartTime.split(":").map(Number);
            const [eh, em] = data.EndTime.split(":").map(Number);

            start.setHours(sh, sm, 0);
            end.setHours(eh, em, 0);

            return end >= start;
         }
         return true;
      }, {
         message: "เวลาสิ้นสุดต้องไม่ก่อนเวลาเริ่มต้น หากเป็นวันเดียวกัน",
         path: ["EndTime"],
      });

   type FormSubmitReservation = z.infer<typeof formSchema>;

   const form = useForm<FormSubmitReservation>({
      resolver: zodResolver(formSchema),
      defaultValues: {
         Firstname: session?.user?.fristName || "",
         Lastname: session?.user?.lastName || "",
         SelectedCarId: car?.car_infoid || "",
         ReservationDetails: '',
         StartDate: undefined,
         EndDate: undefined,
         destination: "",
         StartTime: undefined,
         EndTime: undefined,
         Attendees: [],
         reason_name: "",
      }
   });

   const selectedCarId = form.watch("SelectedCarId");
   const selectedCar = allCarsData.find(carItem => carItem.car_infoid === selectedCarId);

   useEffect(() => {
      const now = new Date();
      const formattedTime = now.toTimeString().slice(0, 5); // HH:mm
      form.setValue("StartTime", formattedTime);
      form.setValue("EndTime", formattedTime);
   }, []);

   useEffect(() => {
      if (selectedCar) {
         form.setValue("ReservationDetails",
            `${formatDatetimeThai(new Date(), true)} จองรถ ${selectedCar.car_band} ${selectedCar.car_tier} (${selectedCar.car_color}) หมายเลขทะเบียน ${selectedCar.car_infocode}`
         );
      }
   }, [selectedCar, form]);

   const onSubmit = async (values: FormSubmitReservation) => {
      const { StartDate, EndDate, StartTime, EndTime, ReservationDetails, reason_name, destination } = values;

      const [hours, minutes] = StartTime.split(":").map(Number);
      const [endHours, endMinutes] = EndTime.split(":").map(Number);

      const combinedStart = new Date(StartDate);
      combinedStart.setHours(hours, minutes, 0);

      const combinedEnd = new Date(EndDate);
      combinedEnd.setHours(endHours, endMinutes, 0);

      const formattedStartTZ = formatForSQLWithTZ(combinedStart);
      const formattedEndTZ = formatForSQLWithTZ(combinedEnd);

      const bookingPayload = {
         UserID: session?.user?.UserID,
         car_infoid: selectedCarId || null,
         reservation_detail: ReservationDetails,
         reason_name,
         destination,
         reservation_date_start: formattedStartTZ,
         reservation_date_end: formattedEndTZ,
      };
      try {
         const response = await client.post(`/reservation/reservation_create_booking`, bookingPayload, {
            headers: dataConfig().header,
         });

         if (response.status === 200) {
            const reservation_id = response.data[0].reservation_id;
            if (reservation_id && values.Attendees?.length) {
               for (const userId of values.Attendees) {
                  const attendeePayload = {
                     reservation_id,
                     UserID: Number(userId.UserID),
                     attend_status: 2,
                     note: userId.note || "",
                     created_by: session?.user?.UserID,
                  };
                  // console.log("Adding attendee:", attendeePayload);
                  try {
                     const res = await client.post(`/reservation/reservation_add_attendees`, attendeePayload, {
                        headers: dataConfig().header,
                     });
                     // console.log("Add attendee response:", res.data);

                     if (res.status !== 200) {
                        console.error("Failed to add attendee:", attendeePayload);
                     }
                  } catch (error) {
                     console.error("Error adding attendee:", error);
                  }
               }
            }
            setShowSuccessAlert(true);
            setTimeout(() => {
               router.push(`/reservations/reservation_bill/${encodeURIComponent(car.car_infoid)}?reservation_id=${reservation_id}`);
            }, 3000);
            form.reset();
            const now = new Date();
            const formattedTime = now.toTimeString().slice(0, 5); // HH:mm
            form.setValue("StartTime", formattedTime);
            form.setValue("EndTime", formattedTime);
            setSelectedUser({ UserID: "", note: "" });
         } else {
            console.error("Failed to submit reservation:", response.data);
         }
      } catch (error) {
         const err = error as { response?: { data?: { message?: string }, status?: number } };
         const message = err.response?.data?.message || "ไม่สามารถดำเนินการได้";
         const status = err.response?.status;
         
         if (status === 409) {
            setErrorTitle("ไม่สามารถจองไม่ได้");
            setErrorMessage(message || "ช่วงเวลานี้ถูกจองแล้ว");

         } else {
            setErrorTitle("ระบบผิดพลาด");
            setErrorMessage(message || "เกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง");
         }
         setShowErrorAlert(true);

         setTimeout(() => {
            setShowErrorAlert(false);
         }, 3000);
         console.error("Error submitting reservation:", error);
      }

      setOpen(false);
   };
   return (
      <>
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
               <Button disabled={status === 2} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white">
                  {status === 2 ? "ไม่สามารถจองได้เนื่องจากซ่อมแซม" : "จองรถ"}
               </Button>

            </DialogTrigger>
            <DialogContent className="max-w-[300px] sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle>จองรถ: {selectedCar?.car_band} {selectedCar?.car_tier}</DialogTitle>
               </DialogHeader>
               {selectedCar?.cover_image_url && (
                  <div className="flex justify-center mb-4">
                     <Image
                        src={selectedCar.cover_image_url}
                        alt={`รูปภาพของ ${selectedCar.car_band} ${selectedCar.car_tier}`}
                        className="w-full max-w-md h-auto rounded-md shadow"
                        width={500}
                        height={300}
                     />
                  </div>
               )}
               <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                           control={form.control}
                           name="Firstname"
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>ชื่อ</FormLabel>
                                 <FormControl>
                                    <Input disabled placeholder="ชื่อ" {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                        <FormField
                           control={form.control}
                           name="Lastname"
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>นามสกุล</FormLabel>
                                 <FormControl>
                                    <Input disabled placeholder="นามสกุล" {...field} />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </div>

                     <FormField
                        control={form.control}
                        name="SelectedCarId"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>เลือกรถ</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                 <FormControl>
                                    <SelectTrigger disabled>
                                       <SelectValue placeholder="เลือกรถที่ต้องการจอง" />
                                    </SelectTrigger>
                                 </FormControl>
                                 <SelectContent>
                                    {allCarsData.map((carItem) => (
                                       <SelectItem key={carItem.car_infoid} value={carItem.car_infoid}>
                                          {carItem.car_band} {carItem.car_tier} ({carItem.car_color}) - {carItem.car_infocode}
                                       </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                              <FormMessage />
                           </FormItem>
                        )}
                     />

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                           control={form.control}
                           name="StartDate"
                           render={({ field }) => (
                              <FormItem className="flex flex-col">
                                 <FormLabel>วันที่เริ่มต้น</FormLabel>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                       <FormControl>
                                          <Button
                                             variant={"outline"}
                                             className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                             )}
                                          >
                                             {field.value ? (
                                                format(field.value, "PPP")
                                             ) : (
                                                <span>เลือกวันที่เริ่มต้น</span>
                                             )}
                                             <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                       </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                       <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                          disabled={{ before: today }}
                                       />
                                    </PopoverContent>
                                 </Popover>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                        <FormField
                           control={form.control}
                           name="EndDate"
                           render={({ field }) => (
                              <FormItem className="flex flex-col">
                                 <FormLabel>วันที่สิ้นสุด</FormLabel>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                       <FormControl>
                                          <Button
                                             variant={"outline"}
                                             className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                             )}
                                          >
                                             {field.value ? (
                                                format(field.value, "PPP")
                                             ) : (
                                                <span>เลือกวันที่สิ้นสุด</span>
                                             )}
                                             <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                       </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                       <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                          disabled={{ before: today }}
                                       />
                                    </PopoverContent>
                                 </Popover>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                           control={form.control}
                           name="StartTime"
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>เวลาเริ่มต้น</FormLabel>
                                 <TimeWheelPicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="กรุณาเลือกเวลา"
                                    selectedDate={form.watch("StartDate") ? form.watch("StartDate").toISOString() : undefined} label={""}                                 />
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                        <FormField
                           control={form.control}
                           name="EndTime"
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>เวลาสิ้นสุด</FormLabel>
                                 <TimeWheelPicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="กรุณาเลือกเวลา"
                                    selectedDate={form.watch("EndDate") ? form.watch("EndDate").toISOString() : undefined} label={""}                                 />
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </div>

                     <FormField
                        control={form.control}
                        name="Attendees"
                        render={({ field }) => {
                           const attendees = field.value || [];
                           const [open, setOpen] = useState(false);
                           const [search, setSearch] = useState("");

                           const availableUsers = userData
                              .filter((u) => u.UserID !== String(session?.user?.UserID))
                              .filter((u) => !attendees.some((a) => a.UserID === u.UserID));

                           const filteredUsers = availableUsers.filter((u) =>
                              u.Fullname.toLowerCase().includes(search.toLowerCase())
                           );

                           const handleAdd = () => {
                              if (selectedUser.UserID && !attendees.some((a) => a.UserID === selectedUser.UserID)) {
                                 field.onChange([...attendees, selectedUser]);
                                 setSelectedUser({ UserID: "", note: "" });
                                 setSearch("");
                                 setOpen(false);
                              }
                           };

                           const handleRemove = (id: string) => {
                              field.onChange(attendees.filter((a) => a.UserID !== id));
                           };

                           return (
                              <FormItem>
                                 <FormLabel>ผู้เข้าร่วม</FormLabel>
                                 <div className="flex flex-col gap-2">
                                    {/* Select User + Note Input */}
                                    <div className="flex gap-2 items-start">
                                       <Popover open={open} onOpenChange={setOpen}>
                                          <PopoverTrigger asChild>
                                             <Button
                                                variant="outline"
                                                className={`${selectedUser.UserID ? "w-[80%] " : "w-[90%] "} justify-between relative pr-10`}
                                                onClick={() => setOpen(true)}
                                             >
                                                <span className="truncate">
                                                   {selectedUser.UserID
                                                      ? userData.find((u) => u.UserID === selectedUser.UserID)?.Fullname
                                                      : "เลือกผู้เข้าร่วม"}
                                                </span>
                                                <ArrowDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                                             </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-[300px] p-0">
                                             <Command>
                                                <CommandInput
                                                   placeholder="ค้นหาชื่อ..."
                                                   value={search}
                                                   onValueChange={setSearch}
                                                   autoFocus
                                                />
                                                <CommandEmpty>ไม่พบผู้ใช้</CommandEmpty>
                                                <CommandGroup className="max-h-72 overflow-y-auto">
                                                   {filteredUsers.map((user) => (
                                                      <CommandItem
                                                         key={user.UserID}
                                                         onSelect={() => {
                                                            setSelectedUser({ UserID: user.UserID, note: "" });
                                                            setSearch("");
                                                         }}
                                                      >
                                                         {user.Fullname}
                                                      </CommandItem>
                                                   ))}
                                                </CommandGroup>
                                             </Command>
                                          </PopoverContent>
                                       </Popover>

                                       {selectedUser.UserID && (
                                          <Button
                                             type="button"
                                             variant="destructive"
                                             className="flex items-center gap-1"
                                             onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedUser({ UserID: "", note: "" });
                                                setSearch("");
                                             }}
                                          >
                                             <XCircle className="h-4 w-4" />
                                             ลบ
                                          </Button>
                                       )}

                                       <Button onClick={handleAdd} disabled={!selectedUser.UserID}>
                                          <CirclePlus className="h-4 w-4" />
                                          เพิ่ม
                                       </Button>
                                    </div>
                                    {selectedUser.UserID && (
                                       <Input
                                          className="w-full"
                                          placeholder="หมายเหตุของผู้ร่วม (ไม่บังคับ)"
                                          value={selectedUser.note}
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                             setSelectedUser((prev) => ({ ...prev, note: e.target.value }))
                                          }
                                          disabled={!selectedUser.UserID}
                                       />
                                    )}
                                    {/* DISPLAY SELECTED */}
                                    <div className="space-y-1">
                                       {attendees.map((att) => {
                                          const user = userData.find((u) => u.UserID === att.UserID);
                                          return (
                                             <div
                                                key={att.UserID}
                                                className="flex justify-between items-center bg-muted px-3 py-1 rounded"
                                             >
                                                <div className="flex flex-col">
                                                   <span>{user?.Fullname || att.UserID}</span>
                                                   <span className="text-sm text-muted-foreground">{att.note}</span>
                                                </div>
                                                <Button
                                                   type="button"
                                                   size="icon"
                                                   variant="ghost"
                                                   onClick={() => handleRemove(att.UserID)}
                                                >
                                                   ✕
                                                </Button>
                                             </div>
                                          );
                                       })}
                                    </div>

                                    <FormMessage />
                                 </div>
                              </FormItem>
                           );
                        }}
                     />


                     <FormField
                        control={form.control}
                        name="ReservationDetails"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>รายละเอียดการจอง</FormLabel>
                              <FormControl>
                                 <Textarea {...field} />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />

                     <FormField
                        control={form.control}
                        name="reason_name"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>เหตุผลในการจอง</FormLabel>
                              <FormControl>
                                 <Textarea {...field} />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />

                     <FormField
                        control={form.control}
                        name="destination"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>สถานที่ปลายทาง</FormLabel>
                              <FormControl>
                                 <Input placeholder="ตัวอย่าง (ไปประชุม ณ บริษัท เพียวพลังงานไทย จังหวัด)" {...field} />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />

                     <DialogFooter>
                        <DialogClose asChild>
                           <Button type="button" variant="secondary">
                              ยกเลิก
                           </Button>
                        </DialogClose>
                        <Button type="submit">
                           ยืนยันการจอง
                        </Button>
                     </DialogFooter>
                  </form>
               </Form>
            </DialogContent>
         </Dialog>
         <SubmitSuccess
            showSuccessAlert={showSuccessAlert}
            setShowSuccessAlert={setShowSuccessAlert}
            title="จองรถสำเร็จ!"
            message={`คุณได้จองรถ ${selectedCar?.car_band} ${selectedCar?.car_tier} (${selectedCar?.car_color}) หมายเลขทะเบียน ${selectedCar?.car_infocode} เรียบร้อยแล้ว`}
            autoHide={true}
            autoHideDelay={3000}
         />
         {showErrorAlert && (
            <SubmitFailed
               showErrorAlert={showErrorAlert}
               setShowErrorAlert={setShowErrorAlert}
               title={errorTitle}
               message={errorMessage}
            />
         )}
      </>
   )
}