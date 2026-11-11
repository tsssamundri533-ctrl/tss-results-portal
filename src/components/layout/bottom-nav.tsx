'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserCheck, Edit3, Users, Building, FileText, Tickets } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";

export function BottomNav() {
  const pathname = usePathname()
  const { role } = useAuthStore()

  if (!role) return null;

  const adminItems = [
    { icon: LayoutDashboard, label: "Home", href: "/admin/dashboard" },
    { icon: Users, label: "Students", href: "/admin/students" },
    { icon: Tickets, label: "Cards", href: "/admin/slips" },
    { icon: Building, label: "Settings", href: "/admin/settings" },
  ]

  const teacherItems = [
    { icon: LayoutDashboard, label: "Home", href: "/teacher/dashboard" },
    { icon: UserCheck, label: "Attendance", href: "/teacher/attendance" },
    { icon: Edit3, label: "Marks", href: "/teacher/marks" },
  ]

  const navItems = role === 'admin' ? adminItems : teacherItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/80 px-4 pb-safe backdrop-blur-xl md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 transition-all duration-300 w-16 relative",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isActive && (
              <span className="absolute -top-1 w-8 h-1 bg-primary rounded-full animate-in fade-in slide-in-from-bottom-1" />
            )}
            <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
            <span className="text-[10px] font-black leading-none tracking-tight uppercase">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}