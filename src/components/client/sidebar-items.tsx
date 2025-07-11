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
  Settings,
} from "lucide-react";

type Role = "Administrador" | "Analista de Tráfico" | "Operador de Tráfico";

const navItems = [
  {
    href: "/dashboard",
    label: "Panel Principal",
    icon: LayoutDashboard,
    roles: ["Administrador", "Analista de Tráfico", "Operador de Tráfico"],
  },
  {
    href: "/dashboard/accidents",
    label: "Registro de Accidentes",
    icon: Siren,
    roles: ["Administrador", "Analista de Tráfico", "Operador de Tráfico"],
  },
  {
    href: "/dashboard/analysis",
    label: "Análisis de Zonas",
    icon: BarChartHorizontal,
    roles: ["Administrador", "Analista de Tráfico"],
  },
  {
    href: "/dashboard/interventions",
    label: "Sugerencias de Intervención",
    icon: Lightbulb,
    roles: ["Administrador", "Analista de Tráfico"],
  },
  {
    href: "/dashboard/controls",
    label: "Puestos de Control",
    icon: Route,
    roles: ["Administrador", "Analista de Tráfico"],
  },
  {
    href: "/dashboard/tracking",
    label: "Seguimiento",
    icon: ClipboardCheck,
    roles: ["Administrador", "Analista de Tráfico"],
  },
  {
    href: "/dashboard/reports",
    label: "Generar Reportes",
    icon: FileDown,
    roles: ["Administrador", "Analista de Tráfico", "Operador de Tráfico"],
  },
  {
    href: "/dashboard/users",
    label: "Gestión de Usuarios",
    icon: Users,
    roles: ["Administrador"],
  },
  {
    href: "/dashboard/settings",
    label: "Configuración",
    icon: Settings,
    roles: ["Administrador"],
  },
];

export function SidebarItems() {
  const pathname = usePathname();
  // SIMULATION: Hardcode the current user's role. 
  // In a real app, this would come from an authentication context.
  const currentUserRole: Role = "Administrador"; 

  const accessibleItems = navItems.filter(item => item.roles.includes(currentUserRole));

  return (
    <SidebarMenu>
      {accessibleItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname.startsWith(item.href) && (item.href !== "/dashboard" || pathname === "/dashboard")}
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
