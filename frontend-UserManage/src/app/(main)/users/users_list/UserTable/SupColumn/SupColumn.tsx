import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import EditUserDialog from "@/app/(main)/users/users_list/EditUser/EditUserDialog"
import DeleteUserDialog from "@/app/(main)/users/users_list/ChangeStatusUser/Delete"
import { useState } from "react"
import ActivateDialog from "../../ChangeStatusUser/Activate"
import ResetPasswordExpireDialog from "../../ChangeStatusUser/ResetPasswordExpire"

interface Props {
  user: UserData;
  onUserFetched?: () => void
  branches: Branch[]
  users: UserData[];
  departments: department[]
  positions: position[]
  sections: Section[]
}

export default function SupColumn({ user, onUserFetched, users, branches, departments, positions, sections }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activateOpen, setActivateOpen] = useState(false)
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false) // เพิ่ม state นี้
  
  const handleEditClick = () => {
    setDropdownOpen(false) // ปิด dropdown ก่อน
    setTimeout(() => {
      setEditOpen(true) // เปิด dialog
    }, 100)
  }
  
  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Action Menu</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(user.UserID)}
          >
            คัดลอก User ID
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(user.Email)}
          >
            คัดลอกอีเมล
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>ดูรายละเอียด</DropdownMenuItem>
          <DropdownMenuItem onClick={handleEditClick}>แก้ไขข้อมูล</DropdownMenuItem>
          <DropdownMenuItem
            className="text-orange-600"
            onClick={() => {
              setDropdownOpen(false)
              setTimeout(() => setResetPasswordOpen(true), 100)
            }}
          >
            บังคับหมดอายุรหัสผ่าน
          </DropdownMenuItem>
          {user.Actived === true ? (
            <DropdownMenuItem 
              className="text-red-600" 
              onClick={() => {
                setDropdownOpen(false)
                setTimeout(() => setDeleteOpen(true), 100)
              }}
            >
              ปิดใช้งานผู้ใช้
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              className="text-green-600" 
              onClick={() => {
                setDropdownOpen(false)
                setTimeout(() => setActivateOpen(true), 100)
              }}
            >
              เปิดใช้งานผู้ใช้
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) {
            setTimeout(() => {
              document.body.style.pointerEvents = '';
              document.body.removeAttribute('data-scroll-locked');
            }, 100);
          }
        }}
        user={user}
        users={users}
        branches={branches}
        departments={departments}
        positions={positions}
        sections={sections}
        onUserUpdated={onUserFetched}
      />

      <ActivateDialog
        user={user}
        open={activateOpen}
        onOpenChange={setActivateOpen}
        onUserActivated={onUserFetched}
      />

      <DeleteUserDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        user={user}
        onUserDeleted={onUserFetched}
      />

      <ResetPasswordExpireDialog
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
        user={user}
        onPasswordExpired={onUserFetched}
      />
    </>
  )
}