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
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/accidents",
    label: "Accident Registration",
    icon: Siren,
  },
  {
    href: "/dashboard/analysis",
    label: "Critical Zone Analysis",
    icon: MapPin,
  },
  {
    href: "/dashboard/interventions",
    label: "Intervention Suggestions",
    icon: Wrench,
  },
  {
    href: "/dashboard/users",
    label: "User Management",
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
