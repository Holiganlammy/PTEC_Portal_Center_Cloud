"use client"

import Link from "next/link"
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight } from "lucide-react"
import { JSX, useState } from "react"
import clsx from "clsx"
import { motion, AnimatePresence } from "framer-motion"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MenuItem {
  id: number;
  parent_id: number | null;
  order_no: number;
  children?: MenuItem[];
  icon?: string;
  name: string;
  path: string;
}

interface SidebarMenuItemProps {
  item: MenuItem;
  activePath: string;
  isCollapsed: boolean;
  getIcon: (menuName?: string) => JSX.Element;
  level?: number;
}

// เมนูบาง entry เก็บเป็น URL เต็ม (ชี้ข้าม origin ไปแอปอื่น เช่น reservation) — ต้องตัด origin ออกก่อนเทียบ
// ไม่งั้น active state จะไม่มีวันตรงกับ activePath ที่เป็น path เปล่าเสมอ
function normalizePathname(path: string): string {
  try {
    return new URL(path).pathname;
  } catch {
    return path;
  }
}

export function SidebarMenuItem({ 
  item, 
  activePath, 
  isCollapsed, 
  getIcon,
  level = 0
}: SidebarMenuItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const normalizedItemPath = item.path ? normalizePathname(item.path) : ""
  const isActive = Boolean(normalizedItemPath) && (
    activePath === normalizedItemPath || activePath.startsWith(`${normalizedItemPath}/`)
  )
  
  const paddingLeft = isCollapsed ? 0 : level * 12

  const toggleOpen = () => {
    if (hasChildren) {
      setIsOpen(!isOpen)
    }
  }

  //  Content ของปุ่ม
  const buttonContent = (
    <Button
      variant="ghost"
      className={clsx(
        "w-full h-9 transition-colors",
        isCollapsed ? "justify-center px-0" : "justify-start",
        isActive 
          ? "bg-gray-800 text-white" 
          : "text-gray-400 hover:text-white hover:bg-gray-800"
      )}
      style={{ paddingLeft: isCollapsed ? undefined : `${paddingLeft + 10}px` }}
      onClick={(e) => {
        if (hasChildren && !isCollapsed && item.path && item.path !== "#") {
          e.preventDefault()
          toggleOpen()
        } else if (hasChildren && (!item.path || item.path === "#")) {
          toggleOpen()
        }
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0">{getIcon(item.name)}</span>
        {!isCollapsed && (
          <span className="text-sm truncate">{item.name}</span>
        )}
      </div>
      {!isCollapsed && hasChildren && (
        <span className="shrink-0 ml-auto">
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
      )}
    </Button>
  )

  return (
    <div>
      {/* Parent Menu Item with Tooltip */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              {item.path && item.path !== "#" ? (
                <Link href={item.path} className="block">
                  {buttonContent}
                </Link>
              ) : (
                buttonContent
              )}
            </div>
          </TooltipTrigger>
          {/*  แสดง Tooltip */}
          <TooltipContent 
            side="right" 
            className="bg-gray-900 text-white border-gray-800"
            sideOffset={5}
          >
            <p className="max-w-xs">{item.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Children Menu Items */}
      {hasChildren && !isCollapsed && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-1 mt-1">
                {item.children
                  ?.sort((a, b) => a.order_no - b.order_no)
                  .map((child) => (
                    <SidebarMenuItem
                      key={child.id}
                      item={child}
                      activePath={activePath}
                      isCollapsed={isCollapsed}
                      getIcon={getIcon}
                      level={level + 1}
                    />
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}