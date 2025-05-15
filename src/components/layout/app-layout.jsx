
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar.jsx";
import { Award } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "./app-header.jsx";
import { Navigation } from "./navigation.jsx";
import { Toaster } from "@/components/ui/toaster.jsx";


export function AppLayout({ children }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar
        variant="sidebar" // can be 'sidebar', 'floating', 'inset'
        collapsible="icon" // can be 'offcanvas', 'icon', 'none'
        className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      >
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <Award className="h-8 w-8 text-sidebar-primary" />
            <span className="text-2xl font-bold text-sidebar-foreground">Telebounties</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <Navigation />
        </SidebarContent>
        <SidebarFooter className="p-2">
          {/* Can add footer items here, e.g., settings, logout */}
        </SidebarFooter>
      </Sidebar>
      <SidebarRail />
      <SidebarInset className="flex flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
          {children}
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
