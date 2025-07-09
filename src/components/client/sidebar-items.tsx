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
  Users,
  BarChartHorizontal,
  Lightbulb,
  ClipboardCheck,
  FileDown,
  Route,
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
    label: "Análisis de Zonas",
    icon: BarChartHorizontal,
  },
  {
    href: "/dashboard/interventions",
    label: "Sugerencias de Intervención",
    icon: Lightbulb,
  },
  {
    href: "/dashboard/controls",
    label: "Puestos de Control",
    icon: Route,
  },
  {
    href: "/dashboard/tracking",
    label: "Seguimiento",
    icon: ClipboardCheck,
  },
  {
    href: "/dashboard/users",
    label: "Gestión de Usuarios",
    icon: Users,
  },
  {
    href: "/dashboard/reports",
    label: "Generar Reportes",
    icon: FileDown,
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
