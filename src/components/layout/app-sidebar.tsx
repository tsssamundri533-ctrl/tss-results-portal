
"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Edit3,
  LogOut,
  ClipboardList,
  GraduationCap,
  Building,
  FileText
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/store/use-auth-store"
import { useAuth } from "@/hooks/use-auth"
import { useSchoolStore } from "@/store/use-school-store"

export function AppSidebar() {
  const pathname = usePathname()
  const { role } = useAuthStore()
  const { logout } = useAuth()
  const settings = useSchoolStore(state => state.settings);

  const adminItems = [
    { title: "Dashboard", icon: LayoutDashboard, url: "/admin/dashboard" },
    { title: "School Settings", icon: Building, url: "/admin/settings" },
    { title: "Students", icon: Users, url: "/admin/students" },
    { title: "Teachers", icon: GraduationCap, url: "/admin/teachers" },
    { title: "Results", icon: FileText, url: "/admin/results" },
    { title: "Seating Plan", icon: ClipboardList, url: "/admin/exams/seating" },
  ]

  const teacherItems = [
    { title: "Dashboard", icon: LayoutDashboard, url: "/teacher/dashboard" },
    { title: "Attendance", icon: UserCheck, url: "/teacher/attendance" },
    { title: "Marks Entry", icon: Edit3, url: "/teacher/marks" },
  ]

  const currentItems = role === 'admin' ? adminItems : teacherItems

  if (!role) return null;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center px-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
            T
          </div>
          <span className="font-bold text-lg tracking-tight group-data-[collapsible=icon]:hidden truncate">
            {settings?.profile?.schoolName || 'The Spirit School Samundri'}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-[10px] font-black uppercase tracking-widest opacity-50">Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {currentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="h-10 px-4"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={logout} 
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 px-4 rounded-xl" 
              tooltip="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-bold">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
