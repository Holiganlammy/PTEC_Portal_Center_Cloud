"use client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import CustomSelect from "@/components/SelectSection/SelectSearch"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"
import SubmitSuccess from "@/components/SubmitAlert/AlertSubmitSuccess/SubmitSuccess"
import SubmitFailed from "@/components/SubmitAlert/AlertSubmitFailed/SubmitFailed"
import dataConfig from '@/config/config';
import client from '@/lib/axios/interceptors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff } from "lucide-react"

const editSchema = z.object({
  Firstname: z.string().min(2, "กรุณากรอกชื่อ"),
  Lastname: z.string().min(2, "กรุณากรอกนามสกุล"),
  loginname: z.string().min(2, "รหัสผู้ใช้ต้องมีอย่างน้อย 2 ตัวอักษร"),
  branchid: z.string().min(1, "กรุณาเลือกสาขา"),
  department: z.string().min(1, "กรุณาเลือกแผนก"),
  secid: z.string().optional(),
  positionid: z.string().min(1, "กรุณาเลือกตำแหน่ง"),
  empupper: z.string().optional(),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  role_id: z.string().min(1, "กรุณาเลือกบทบาทผู้ใช้"),
  password: z.string()
    .refine((val) => val === "" || val.length >= 8, {
      message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"
    })
    .refine((val) => val === "" || /[A-Z]/.test(val), {
      message: "รหัสผ่านต้องมีอักษรตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว"
    })
    .refine((val) => val === "" || /[!@#$%^&*(),.?":{}|<>_\-]/.test(val), {
      message: "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว"
    })
    .optional()
    .or(z.literal(""))
});

type EditForm = z.infer<typeof editSchema>
interface EditUserDialogProps {
  user: UserEdit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated?: () => void
  users: UserData[]
  branches: Branch[]
  departments: department[]
  positions: position[]
  sections: Section[]
}


export default function EditUserDialog({ user, open, onOpenChange, onUserUpdated, users, branches, departments, positions, sections }: EditUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [fullNameValue, setFullNameValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      Firstname: "",
      Lastname: "",
      loginname: "",
      branchid: "",
      department: "",
      secid: "",
      positionid: "",
      empupper: "",
      email: "",
      role_id: "",
      password: ""
    }
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        Firstname: user.fristName ?? 'null',
        Lastname: user.lastName ?? 'null',
        loginname: user.UserCode,
        branchid: user.BranchID.toString(),
        department: user.DepID.toString(),
        secid: user.SecID?.toString() || "",
        positionid: user.PositionID.toString(),
        empupper: user.EmpUpperID || "",
        email: user.Email,
        password: "",
        role_id: user.role_id?.toString() ?? ""
      });
      setShowPassword(false); // รีเซ็ตสถานะแสดงรหัสผ่านเมื่อเปิด dialog
    }
  }, [user, open, form]);

  const onSubmit = async (values: EditForm) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const Name = `${values.Firstname} ${values.Lastname}`;
      const submitData = { ...values, Name };
      if (!submitData.password || submitData.password.toString() === "") {
        delete submitData.password;
      }
      const response = await client.put(`/user/${user.UserID}`, submitData, {
        headers: dataConfig().header
      });
      const data = await response.data;

      if (response.status === 200) {
        setFullNameValue(`${values.Firstname} ${values.Lastname}`);
        onOpenChange(false);
        setShowSuccessAlert(true);
        if (onUserUpdated) {
          onUserUpdated();
        }
        setTimeout(() => {
          setShowSuccessAlert(false);
        }, 5000);
      } else {
        console.error("Failed to update user:", data);
        setFullNameValue(`${values.Firstname} ${values.Lastname}`);
        setShowErrorAlert(true);
        setTimeout(() => {
          setShowErrorAlert(false);
        }, 5000);
        return;
      }

    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[300px] sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลผู้ใช้</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลของ {user?.UserCode} ({user?.Fullname})
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Firstname */}
                <FormField
                  control={form.control}
                  name="Firstname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อ</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณา กรอกชื่อ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Lastname */}
                <FormField
                  control={form.control}
                  name="Lastname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>นามสกุล</FormLabel>
                      <FormControl>
                        <Input placeholder="กรุณา กรอกนามสกุล" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Username */}
                <FormField
                  control={form.control}
                  name="loginname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รหัสผู้ใช้</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="รหัสผู้ใช้"
                          {...field}
                          disabled
                          className="bg-gray-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Branch ID */}
                <FormField
                  control={form.control}
                  name="branchid"
                  render={({ field }) => (
                    <FormItem>
                      <CustomSelect
                        field={field}
                        placeholder="เลือกสาขา"
                        formLabel="สาขา"
                        options={branches.map(branch => ({
                          value: branch.branchid.toString(),
                          label: branch.name
                        }))}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Department ID */}
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <CustomSelect
                        field={field}
                        placeholder="เลือกแผนก"
                        formLabel="แผนก"
                        options={departments.map(department => ({
                          value: department.depid.toString(),
                          label: department.name
                        }))}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Section ID */}
                <FormField
                  control={form.control}
                  name="secid"
                  render={({ field }) => (
                    <FormItem>
                      <CustomSelect
                        field={field}
                        placeholder="เลือกฝ่าย (หากมี)"
                        formLabel="ฝ่าย"
                        options={sections.map(section => ({
                          value: section.secid.toString(),
                          label: section.codename
                        }))}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Position ID */}
                <FormField
                  control={form.control}
                  name="positionid"
                  render={({ field }) => (
                    <FormItem>
                      <CustomSelect
                        field={field}
                        placeholder="เลือกตำแหน่ง"
                        formLabel="ตำแหน่ง"
                        options={positions.map(position => ({
                          value: position.positionid.toString(),
                          label: position.position
                        }))}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Empupper */}
                <FormField
                  control={form.control}
                  name="empupper"
                  render={({ field }) => (
                    <FormItem>
                      <CustomSelect
                        field={field}
                        placeholder="เลือกหัวหน้า (หากมี)"
                        formLabel="หัวหน้า"
                        options={users
                          .filter(u => u.UserID !== user?.UserID)
                          .map(userData => ({
                            value: userData.UserID,
                            label: `${userData.UserCode} - ${userData.Fullname.includes(':')
                              ? userData.Fullname.split(':')[1].trim()
                              : userData.Fullname}`
                          }))
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>อีเมล</FormLabel>
                      <FormControl>
                        <Input placeholder="กรอกอีเมล" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role */}
                <FormField
                  control={form.control}
                  name="role_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>บทบาทผู้ใช้</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="เลือกบทบาทผู้ใช้" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Admin</SelectItem>
                          <SelectItem value="2">User</SelectItem>
                          <SelectItem value="8">User (SmartBill/SmartCar)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="max-w-md">
                    <FormLabel>รหัสผ่านใหม่</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="กรอกรหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)"
                          type={showPassword ? "text" : "password"}
                          {...field}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={!field.value}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500 mt-1">
                      หากไม่ต้องการเปลี่ยนรหัสผ่าน ให้เว้นว่างไว้
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร, มีอักษรตัวใหญ่อย่างน้อย 1 ตัว และมีอักขระพิเศษอย่างน้อย 1 ตัว (เช่น !@# หรือ _-)
                    </p>
                  </FormItem>
                )}
              />

              {/* Footer buttons */}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" disabled={isLoading}>
                    ยกเลิก
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {/* Success Toast Alert */}
      <SubmitSuccess
        showSuccessAlert={showSuccessAlert}
        fullNameValue={fullNameValue}
        setShowSuccessAlert={setShowSuccessAlert}
      />
      <SubmitFailed
        showErrorAlert={showErrorAlert}
        fullNameValue={fullNameValue}
        setShowErrorAlert={setShowErrorAlert}
      />
    </>
  )
}