
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/types";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { LayoutGrid, UserCircle2, Trophy, Settings } from "lucide-react"; // Added Settings icon

const navItems: NavItem[] = [
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
    title: "Leaderboard",
    href: "/leaderboard",
    icon: Trophy,
  },
  {
    title: "Settings", // New Item
    href: "/settings",
    icon: Settings,   // New Icon
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
              asChild={false} // Ensure it's a button for proper styling and behavior from Sidebar component
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

