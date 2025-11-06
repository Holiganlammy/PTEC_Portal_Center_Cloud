"use client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircleIcon, Eye, EyeOff, Loader2, User, Lock } from "lucide-react"
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link";
import { signIn } from 'next-auth/react';
import MfaDialog from "./MFAVerify/MFA";
import dataConfig from "@/config/config";
import client, { isTokenExpiredAlertVisible, resetAxiosState } from "@/lib/axios/interceptors";

export default function Login() {
  const router = useRouter();
  const [showMfaDialog, setShowMfaDialog] = useState(false);
  const [userLogin, setUserLogin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [disableSubmit, setDisableSubmit] = useState(false);
  const [shouldShowSessionAlert, setShouldShowSessionAlert] = useState(false);
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const isExpired = searchParams.get('expired') === 'true';
  const redirectPath = redirectParam?.startsWith('/') ? redirectParam : '/home';
  

  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        setTimeout(() => setError(null), 300);
      }, 10000)
      return () => clearTimeout(timer);
    }
  }, [error])

  useEffect(() => {
    const checkTokenAlert = () => {
      setShouldShowSessionAlert(isExpired && !isTokenExpiredAlertVisible());
    };
    
    checkTokenAlert();
    const interval = setInterval(checkTokenAlert, 100);
    
    return () => clearInterval(interval);
  }, [isExpired]);

  const formSchema = z.object({
    loginname: z.string()
      .min(2, "ชื่อผู้ใช้ต้องมีอย่างน้อย 2 ตัวอักษร"),

    password: z.string()
      .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
      .regex(/[A-Z]/, "รหัสผ่านต้องมีอย่างน้อย 1 ตัวอักษรใหญ่")
      .regex(/[!@#$%^&*(),.?":{}|<>_-]/, "รหัสผ่านต้องมีอย่างน้อย 1 ตัวอักษรพิเศษ")
    });

  type FormLogin = z.infer<typeof formSchema>;

  const form = useForm<FormLogin>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loginname: "",
      password: ""
    }
  });

  const onSubmit = async (values: FormLogin) => {
    setIsLoading(true);
    setError(null);
    setShowError(false);

    try {
      const payload = {
        loginname: values.loginname,
        password: values.password,
      };
      const res = await client.post("/login", payload, {
        headers: dataConfig().header,
        withCredentials: true,
      })
      const data = await res.data;

      
      if (data?.request_Mfa === true) {
        setOtpExpiresAt(data.expiresAt);
        setUserLogin(values.loginname);
        setShowMfaDialog(true);
        return;
      }
      const response = await signIn('credentials', {
        redirect: false,
        responseCondition: 'pass',
        responseLogin: JSON.stringify(data),
      });
      if (!response?.ok) {
        if (response?.status == 401) {
          throw new Error('Invalid credentials');
        }
        throw new Error('api fail');
      } else {
        resetAxiosState();
        
        router.push(redirectPath);
        setIsLoading(false);
        setDisableSubmit(false);
      }

    } catch (error) {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      setTimeout(() => setShowError(true), 100);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            PTEC Portal Systems
          </h1>
          <p className="text-gray-600 text-sm">
            Sign in to NAC Systems , User Management System , Reservation System
          </p>
          <p className="text-gray-600 text-sm">
            SmartBill / SmartCar System , Audit System
          </p>
        </div>

        {/* Session Expired Alert */}
        {shouldShowSessionAlert && (
          <Alert
            variant="destructive"
            className="mb-6 border-yellow-200 bg-yellow-50"
          >
            <AlertCircleIcon className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">เซสชันหมดอายุ</AlertTitle>
            <AlertDescription className="text-yellow-700">
              เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert
            variant="destructive"
            className={`mb-6 transition-all duration-300 ease-in-out transform ${showError
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-2'
            }`}
          >
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>เข้าสู่ระบบล้มเหลว</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Username Field */}
            <FormField
              control={form.control}
              name="loginname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-black mb-2">
                    Username
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input 
                        placeholder="Enter your username" 
                        className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-sm font-medium text-black mb-2">
                    Password
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter your password" 
                          className="pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                          {...field} 
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                          onClick={() => setShowPassword((prev) => !prev)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link 
                href="/forget_password" 
                className="text-sm font-medium text-black hover:underline transition-colors"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || disableSubmit}
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </Form>
      </div>
    
      <MfaDialog
        showMfaDialog={showMfaDialog}
        setShowMfaDialog={setShowMfaDialog}
        redirectPath={redirectPath}
        userLogin={userLogin}
        otpExpiresAt={otpExpiresAt}
      />
    </>
  );
}