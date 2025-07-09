"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Siren,
  MapPin,
  Wrench,
  Users,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Panel Principal",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/accidents",
    label: "Registro de Accidentes",
    icon: Siren,
  },
  {
    href: "/dashboard/analysis",
    label: "Análisis Zonas Críticas",
    icon: MapPin,
  },
  {
    href: "/dashboard/interventions",
    label: "Sugerir Intervenciones",
    icon: Wrench,
  },
  {
    href: "/dashboard/users",
    label: "Gestión de Usuarios",
    icon: Users,
  },
];

export function SidebarItems() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
