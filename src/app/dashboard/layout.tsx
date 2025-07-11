import React from "react";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, LogOut, Settings } from "lucide-react";
import { SidebarItems } from "@/components/client/sidebar-items";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
              Centinela Vial
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarItems />
        </SidebarContent>
        <SidebarFooter>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="group-data-[collapsible=icon]:p-2 p-2.5 flex items-center gap-2.5 cursor-pointer rounded-md hover:bg-sidebar-accent">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://i.pravatar.cc/150?u=carlos" alt="Admin" />
                        <AvatarFallback>CV</AvatarFallback>
                    </Avatar>
                    <div className="group-data-[collapsible=icon]:hidden flex flex-col items-start">
                        <p className="text-sm font-medium">Carlos Vargas</p>
                        <p className="text-xs text-muted-foreground">Administrador</p>
                    </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b px-6">
            <SidebarTrigger />
            {/* Can add more header content here */}
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
