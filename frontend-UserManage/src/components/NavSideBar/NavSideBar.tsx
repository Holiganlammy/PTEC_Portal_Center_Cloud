"use client"
import Link from "next/link"
import { 
  LockKeyholeOpen, 
  User, 
  PanelLeft, // เปลี่ยนเป็น PanelLeft
  Settings as SettingsIcon,
  LogOut,
  ChevronsUpDown,
  Home,
  Users,
  FileText,
  Settings,
  BarChart3,
  Package,
  ShoppingCart,
  Truck,
  Calendar,
  MessageSquare,
  Bell,
  Search
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState, useRef, JSX } from "react"
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useSession, signOut } from 'next-auth/react'
import dataConfig from "@/config/config"
import client from "@/lib/axios/interceptors"
import { buildMenuTree } from '@/type/buildMenuTree'
import { SidebarMenuItem } from "./SidebarMenuItem"
import clsx from "clsx"
import ChangePasswordDialog from "@/app/login/LoginComponents/ChangePassword/Change"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Purethai from "@/image/SHWJSE6g_400x400.jpg";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface MenuItem {
  id: number;
  parent_id: number | null;
  order_no: number;
  children?: MenuItem[];
  icon?: string; //  เพิ่ม icon field
  name: string;
  path: string;
}

interface SiteHeaderProps {
  children: React.ReactNode;
}

//  Icon mapping helper
const getIcon = (menuName?: string) => {
  const icons: Record<string, JSX.Element> = {
    "dashboard": <BarChart3 className="h-4 w-4" />,
    "password": <LockKeyholeOpen className="h-4 w-4" />,
    "user list": <Users className="h-4 w-4" />,
    "เพิ่มบัญชีทรัพย์สิน": <FileText className="h-4 w-4" />,
    "โยกย้ายบัญชีทรัพย์สิน": <Truck className="h-4 w-4" />,
    "เปลี่ยนแปลงรายละเอียดทรัพย์สิน": <Settings className="h-4 w-4" />,
    "ตัดบัญชีทรัพย์สิน": <Package className="h-4 w-4" />,
    "ขายบัญชีทรัพย์สิน": <ShoppingCart className="h-4 w-4" />,
    "รายการเอกสารทั่วไป": <FileText className="h-4 w-4" />,
    "รายการเอกสารทั้งหมด": <FileText className="h-4 w-4" />,
    "Create Period": <Calendar className="h-4 w-4" />,
    "List Period": <Calendar className="h-4 w-4" />,
    "รายงานตรวจนับทรัพย์สิน": <BarChart3 className="h-4 w-4" />,
    "Create Document": <FileText className="h-4 w-4" />,
    "ทะเบียนทรัพย์สิน": <Package className="h-4 w-4" />,
    "Smart Car": <Truck className="h-4 w-4" />,
    "Smart Bill": <FileText className="h-4 w-4" />,
    "Cars Reservation": <Truck className="h-4 w-4" />,
    "Meeting Rooms Reservation": <Calendar className="h-4 w-4" />,
    "Tools Document": <Settings className="h-4 w-4" />,
    "E-Book": <FileText className="h-4 w-4" />,
    "ESG Report": <BarChart3 className="h-4 w-4" />,
  };

  const key = menuName?.toLowerCase().trim() || "";
  return icons[key] || <Package className="h-4 w-4" />;
};

export default function SiteHeader({ children }: SiteHeaderProps) {
  const { data: session, status } = useSession({ required: false })
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openChangePassword, setOpenChangePassword] = useState(false)
  const [menus, setMenu] = useState<MenuItem[]>([])
  const menuTree = useMemo(() => buildMenuTree(menus as MenuItem[]), [menus])
  const hasFetchedMenus = useRef(false)

  const handleLogout = () => {
    signOut({ redirect: false })
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const fetchMenus = useCallback(async () => {
    if (!session?.user?.UserID) return
    
    try {
      const response = await client.post(`/Apps_List_Menu`, { UserID: session?.user.UserID }, {
        headers: dataConfig().header
      })
      const data = await response.data
      if (data.length > 0) {
        setMenu(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }, [session?.user?.UserID])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.UserID && !hasFetchedMenus.current) {
      hasFetchedMenus.current = true
      fetchMenus()
    }
  }, [status, session?.user?.UserID, fetchMenus])

  return (
    <div className="flex h-screen w-screen overflow-hidden fixed inset-0">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? "60px" : "240px" }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="bg-[#0a0a0a] border-r border-gray-800 flex flex-col shrink-0 h-full"
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-center p-4 border-b border-gray-800 min-h-[60px]">
          <AnimatePresence mode="wait">
            {isCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black overflow-hidden">
                  <Image 
                    src={Purethai} 
                    alt="Logo" 
                    width={32} 
                    height={32} 
                    className="object-cover rounded-lg"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black overflow-hidden">
                  <Image 
                    src={Purethai} 
                    alt="Logo" 
                    width={32} 
                    height={32} 
                    className="object-cover rounded-lg"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-white truncate">PURETHAI ENERGY</span>
                  <span className="text-xs text-gray-400 truncate">Company</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Platform Section */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-3">
            {!isCollapsed && (
              <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-gray-500 uppercase">
                Platform
              </h2>
            )}
            <div className="space-y-1">
              {/*  Home Link */}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/">
                      <Button
                        variant="ghost"
                        className={clsx(
                          "w-full h-9 transition-colors",
                          isCollapsed ? "justify-center px-0" : "justify-start gap-2",
                          pathname === "/" 
                            ? "bg-gray-800 text-white" 
                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                        )}
                      >
                        <Home className="h-4 w-4 shrink-0" />
                        {!isCollapsed && <span className="text-sm">Home</span>}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="right" 
                    className="bg-gray-900 text-white border-gray-800"
                    //  แสดง Tooltip เฉพาะตอนพับ หรือลบ condition นี้ถ้าต้องการแสดงเสมอ
                  >
                    <p>Home</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Menu Items */}
              {session &&
                menuTree
                  .sort((a, b) => a.order_no - b.order_no)
                  .map((item) => (
                    <SidebarMenuItem
                      key={item.id}
                      item={item}
                      activePath={pathname}
                      isCollapsed={isCollapsed}
                      getIcon={getIcon}
                    />
                  ))}
            </div>
          </div>

          {/* Projects Section */}
          {!isCollapsed && (
            <div className="px-3 mt-6">
              <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-gray-500 uppercase">
                Projects
              </h2>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-gray-300 hover:text-white hover:bg-gray-800 h-9"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm">Design Engineering</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-gray-300 hover:text-white hover:bg-gray-800 h-9"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">Sales & Marketing</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* User Footer */}
        <div className="border-t border-gray-800 p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={clsx(
                  "w-full h-auto py-2 hover:bg-gray-800",
                  isCollapsed ? "justify-center px-0" : "justify-start gap-2"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={session?.user.img_profile} />
                  <AvatarFallback className="bg-purple-600">
                    <User className="h-4 w-4 text-white" />
                  </AvatarFallback>
                </Avatar>
                
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col items-start text-left flex-1 min-w-0 overflow-hidden"
                    >
                      <span className="text-sm font-medium text-white truncate w-full">
                        {session?.user.UserCode || "Guest"}
                      </span>
                      <span className="text-xs text-gray-400 truncate w-full">
                        {session?.user.Email || "m@example.com"}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isCollapsed && (
                  <ChevronsUpDown className="h-4 w-4 text-gray-400 shrink-0" />
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent 
              className="w-56 bg-[#0a0a0a] border-gray-800 text-white" 
              align={isCollapsed ? "end" : "start"} 
              side="right"
            >
              <DropdownMenuLabel className="text-gray-400">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-white">
                    {`${session?.user.fristName} ${session?.user.lastName}` || "-"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session?.user.Email || "m@example.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuGroup>
                <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800 text-gray-300">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800 text-gray-300">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setOpenChangePassword(true)}
                  className="hover:bg-gray-800 focus:bg-gray-800 text-gray-300"
                >
                  <LockKeyholeOpen className="mr-2 h-4 w-4" />
                  Change Password
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-400 hover:bg-gray-800 focus:bg-gray-800"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Top Header -  ย้าย PanelLeft มาที่นี่ */}
        <div className="h-[60px] border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center px-6 shrink-0 gap-4">
          {/*  Toggle Sidebar Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-8 w-8 shrink-0"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Building Your Application</span>
            <span>/</span>
            <span className="text-foreground font-medium">{pathname.split('/').pop() || 'Home'}</span>
          </div>
        </div>

        {/* Page Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-background">
          {children}
        </div>
      </div>

      <ChangePasswordDialog open={openChangePassword} setOpen={setOpenChangePassword} />
    </div>
  )
}