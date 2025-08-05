
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils.js";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar.jsx";
import { LayoutGrid, UserCircle2, Settings, ShieldCheck, Home, Trophy } from "lucide-react"; 
import { useAuth } from "@/contexts/auth-context.jsx";

const navItems = [
   {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "All Tasks",
    href: "/tasks",
    icon: LayoutGrid,
  },
  {
    title: "Leaderboard",
    href: "/leaderboard",
    icon: Trophy,
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

const adminNavItems = [
  {
    title: "Admin Review",
    href: "/admin/review",
    icon: ShieldCheck,
  }
];

export function Navigation() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const getIsActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const itemsToDisplay = [...navItems];
  if (currentUser && currentUser.isAdmin) {
    itemsToDisplay.push(...adminNavItems);
  }

  return (
    <SidebarMenu>
      {itemsToDisplay.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            className={cn(
              "w-full justify-start",
              getIsActive(item.href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent/80"
            )}
            isActive={getIsActive(item.href)}
            tooltip={{ children: item.title, side: "right", align: "center" }}
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-5 w-5" />
              <span className="truncate">{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
