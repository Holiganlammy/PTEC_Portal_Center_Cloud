"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { KeyRound, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import client from "@/lib/axios/interceptors";
import dataConfig from "@/config/config";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type PasswordExpireDialogProps = {
  showPasswordExpireDialog: boolean;
  setShowPasswordExpireDialog: (value: boolean) => void;
  userLogin: string;
};

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
  newPassword: z.string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
    .regex(/[a-z]/, "ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว")
    .regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว"),
  confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

type PasswordSchema = z.infer<typeof passwordSchema>;

export default function PasswordExpireDialog({
  showPasswordExpireDialog,
  setShowPasswordExpireDialog,
  userLogin,
}: PasswordExpireDialogProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const form = useForm<PasswordSchema>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = form.watch("newPassword");

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthLabel = ["", "อ่อนแอ", "ปานกลาง", "ดี", "แข็งแรง", "แข็งแรงมาก", "ปลอดภัยสูง"];
  const strengthColor = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500", "bg-emerald-600"];

  const handleSubmit = async (values: PasswordSchema) => {
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const response = await client.post("/user/change-password", {
        userCode: userLogin,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      }, {
        headers: dataConfig().header,
        withCredentials: true,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          setShowPasswordExpireDialog(false);
          router.push("/login");
        }, 2000);
      } else {
        setError(response.data.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
      }
    } catch (err: any) {
      console.error("Change password failed:", err);
      setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={showPasswordExpireDialog} onOpenChange={setShowPasswordExpireDialog}>
      <DialogContent className="sm:max-w-md mx-auto bg-white border border-gray-200">
        {success ? (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>

            <DialogHeader className="text-center mb-6">
              <DialogTitle className="text-xl 3xl:text-2xl text-green-600">
                เปลี่ยนรหัสผ่านสำเร็จ
              </DialogTitle>
              <DialogDescription className="text-gray-600 leading-relaxed text-sm 3xl:text-base">
                รหัสผ่านของคุณได้รับการเปลี่ยนแปลงเรียบร้อยแล้ว
                <br />
                กำลังนำคุณไปหน้าเข้าสู่ระบบ...
              </DialogDescription>
            </DialogHeader>

            <p className="text-xs 3xl:text-sm text-gray-500 mt-4">
              หน้าต่างจะปิดโดยอัตโนมัติในอีกสักครู่...
            </p>
          </div>
        ) : (
          <>
            <DialogHeader className="text-center space-y-3 pb-2">
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl hidden 3xl:flex items-center justify-center shadow-lg">
                <KeyRound className="w-4 h-4 3xl:w-7 3xl:h-7 text-white" />
              </div>

              <div>
                <DialogTitle className="text-sm 3xl:text-2xl font-bold text-gray-900">
                  เปลี่ยนรหัสผ่าน
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2 text-xs 3xl:text-sm">
                  รหัสผ่านของคุณหมดอายุแล้ว กรุณาตั้งรหัสผ่านใหม่
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-5 pt-2">
          {/* User info */}
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4.5 3xl:h-4.5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600">ผู้ใช้งาน</p>
                <p className="font-semibold text-gray-900 text-sm">{userLogin}</p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
              <AlertCircle className="w-3 h-3 3xl:w-5 3xl:h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-xs 3xl:text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Current Password */}
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs 3xl:text-sm font-medium text-gray-700">
                      รหัสผ่านปัจจุบัน
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="กรอกรหัสผ่านปัจจุบัน"
                          className="pl-10 pr-10 h-8 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* New Password */}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs 3xl:text-sm font-medium text-gray-700">
                      รหัสผ่านใหม่
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="กรอกรหัสผ่านใหม่"
                          className="pl-10 pr-10 h-8 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i < passwordStrength ? strengthColor[passwordStrength] : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    ความแข็งแรง: <span className="font-medium">{strengthLabel[passwordStrength]}</span>
                  </p>
                </div>
              )}

              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs 3xl:text-sm font-medium text-gray-700">
                      ยืนยันรหัสผ่านใหม่
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                          className="pl-10 pr-10 h-8 border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2">รหัสผ่านต้องประกอบด้วย:</p>
                <ul className="grid grid-cols-2 3xl:grid-cols-1 gap-1 text-xs text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-400'}`} />
                    อย่างน้อย 8 ตัวอักษร
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-400'}`} />
                    ตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full ${/[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-400'}`} />
                    ตัวพิมพ์เล็กอย่างน้อย 1 ตัว
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-400'}`} />
                    ตัวเลขอย่างน้อย 1 ตัว
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold text-white bg-gray-900 hover:bg-gray-800 active:bg-gray-700 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={isSubmitting || success}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    กำลังเปลี่ยนรหัสผ่าน...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    เปลี่ยนรหัสผ่าน
                  </div>
                )}
              </Button>
            </form>
          </Form>

          {/* Help text */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              กรุณาจดจำรหัสผ่านใหม่ของคุณไว้ให้ดี
            </p>
          </div>
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}