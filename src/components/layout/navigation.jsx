
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils.js";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar.jsx";
import { LayoutGrid, UserCircle2, Settings } from "lucide-react"; 

const navItems = [
  {
    title: "Tasks",
    href: "/",
    icon: LayoutGrid,
  },
  {
    title: "My Profile",
    href: "/profile",
    icon: UserCircle2,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.title}>
          <Link href={item.href} legacyBehavior passHref>
            <SidebarMenuButton
              asChild={false} 
              className={cn(
                "w-full justify-start",
                pathname === item.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/80"
              )}
              isActive={pathname === item.href}
              tooltip={{ children: item.title, side: "right", align: "center" }}
            >
              <item.icon className="mr-2 h-5 w-5" />
              <span className="truncate">{item.title}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
