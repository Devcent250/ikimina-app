"use client";

import * as React from "react";
import {
  Activity,
  Blocks,
  Folder,
  HandCoins,
  LayoutGrid,
  MinusCircle,
  Settings,
  ShoppingBag,
  Ticket,
  User,
  Users,
  Building2,
} from "lucide-react";

import { NavMain } from "@/components/ui/nav-main";
import { NavUser } from "@/components/ui/nav-user";
import { TeamSwitcher } from "@/components/ui/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth.context";
import { useLocation } from "react-router-dom";

// This is sample data.

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const pathname = useLocation().pathname;

  const data = React.useMemo(() => {
    return {
      user: {
        name: user?.name,
        email: user?.email,
        profileUrl: user?.profileUrl,
        role: "Admin",
      },
      teams: [{ name: "Vison Genes", id: "4567" }].map((e) => {
        return {
          id: e.id,
          name: e.name,
          plan: "Enterprise",
        };
      }),
      navMain: [
        {
          title: "Dashboard & Overview",
          url: "/dashboard",
          icon: LayoutGrid,
          isActive: pathname.startsWith("/dashboard"),
        },
        {
          title: "Savings Members",
          url: "/members",
          icon: User,
          isActive: pathname.startsWith("/members"),
        },
        {
          title: "Contributions",
          url: "/contributions",
          icon: HandCoins,
          isActive: pathname.startsWith("/contributions"),
        },
        {
          title: "Loans & Payments",
          url: "/loans",
          icon: MinusCircle,
          isActive: pathname.startsWith("/loans"),
        },
        // fines & penalties
        {
          title: "Fines & Penalties",
          url: "/fines",
          icon: Ticket,
          isActive: pathname.startsWith("/fines"),
        },
        // expenses
        {
          title: "Expenses & Bills",
          url: "/expenses",
          icon: ShoppingBag,
          isActive: pathname.startsWith("/expenses"),
        },
        {
          title: "Saving Groups",
          url: "/saving-groups",
          icon: Users,
          isActive: pathname.startsWith("/saving-groups"),
        },
        {
          title: "Districts",
          url: "/districts",
          icon: Building2,
          isActive: pathname.startsWith("/districts"),
        },
        {
          title: "Zones",
          url: "/zones",
          icon: Folder,
          isActive: pathname.startsWith("/zones"),
        },
        {
          title: "Saving Seasons",
          url: "/saving-seasons",
          icon: Blocks,
          isActive: pathname.startsWith("/saving-seasons"),
        },
        {
          title: "Reports & Analytics",
          url: "#",
          icon: Activity,
          isActive: pathname.startsWith("/reports"),
          items: [
            {
              title: "Contributions reports",
              url: "/reports/contributions-reports",
            },
            {
              title: "Loans reports",
              url: "/reports/loans-reports",
            },
            {
              title: "General season reports",
              url: "/reports/general-season-reports",
            },
            {
              title: "Expense reports",
              url: "/reports/expense-reports",
            },
          ],
        },
      ],
      projects: [
        {
          title: "Settings",
          url: "#",
          icon: Settings,
          isActive: pathname.startsWith("/settings"),
          items: [
            {
              title: "General Information",
              url: "/settings/general-information",
            },
            {
              title: "Account settings",
              url: "/settings/account-settings",
            },
            // expense categories
            {
              title: "Expense categories",
              url: "/settings/expense-categories",
            },
            // payment methods
            {
              title: "Payment methods",
              url: "/settings/payment-methods",
            }, // role & permissions
            {
              title: "Role & Permissions",
              url: "/settings/role-permissions",
            },
            // system users
            {
              title: "System Users",
              url: "/settings/system-users",
            },
          ],
        },
      ],
    };
  }, [user]);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain title="Platform Management" items={data.navMain} />
        <NavMain title="Configuration & settings" items={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
