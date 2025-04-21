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
  UserCog,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const pathname = useLocation().pathname;
  
  // Check if user is admin or has specific permissions
  const isAdmin = user?.isAdmin === true;
  const userPermissions = user?.role?.permissions || {};
  
  const canAccessRoutes = {
    members: true, // Always accessible for logged-in users
    contributions: true, // Always accessible for logged-in users
    loans: true, // Always accessible for logged-in users
    expenses: true, // Always accessible for logged-in users
    
    // Admin-only or permission-based routes
    fines: isAdmin,
    savingGroups: isAdmin,
    branches: isAdmin,
    savingSeasons: isAdmin,
    reports: isAdmin,
    settings: isAdmin || (userPermissions.roles && userPermissions.roles.includes('read')),
    accountSettings: true // Always accessible for all users
  };

  const data = React.useMemo(() => {
    // Define all navigation items with conditional filtering
    const navMain = [
      {
        title: "Dashboard & Overview",
        url: "/dashboard",
        icon: LayoutGrid,
        isActive: pathname.startsWith("/dashboard"),
        show: canAccessRoutes.members // Always show dashboard
      },
      {
        title: "Savings Members",
        url: "/members",
        icon: User,
        isActive: pathname.startsWith("/members"),
        show: canAccessRoutes.members
      },
      {
        title: "Contributions",
        url: "/contributions",
        icon: HandCoins,
        isActive: pathname.startsWith("/contributions"),
        show: canAccessRoutes.contributions
      },
      {
        title: "Loans & Payments",
        url: "/loans",
        icon: MinusCircle,
        isActive: pathname.startsWith("/loans"),
        show: canAccessRoutes.loans
      },
      {
        title: "Fines & Penalties",
        url: "/fines",
        icon: Ticket,
        isActive: pathname.startsWith("/fines"),
        show: canAccessRoutes.fines
      },
      {
        title: "Expenses & Bills",
        url: "/expenses",
        icon: ShoppingBag,
        isActive: pathname.startsWith("/expenses"),
        show: canAccessRoutes.expenses
      },
      {
        title: "Saving Groups",
        url: "/saving-groups",
        icon: Users,
        isActive: pathname.startsWith("/saving-groups"),
        show: canAccessRoutes.savingGroups
      },
      {
        title: "Branches",
        url: "/branches",
        icon: Folder,
        isActive: pathname.startsWith("/branches"),
        show: canAccessRoutes.branches
      },
      {
        title: "Saving Seasons",
        url: "/saving-seasons",
        icon: Blocks,
        isActive: pathname.startsWith("/saving-seasons"),
        show: canAccessRoutes.savingSeasons
      },
      {
        title: "Reports & Analytics",
        url: "#",
        icon: Activity,
        isActive: pathname.startsWith("/reports"),
        show: canAccessRoutes.reports,
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
    ].filter(item => item.show);

    // Create settings items based on user permissions
    const settingsItems = [];
    
    // Account settings is always accessible
    settingsItems.push({
      title: "Account settings",
      url: "/settings/account-settings",
    });
    
    // Only add these for admin users
    if (isAdmin) {
      settingsItems.push(
        {
          title: "General Information",
          url: "/settings/general-information",
        },
        {
          title: "Expense categories",
          url: "/settings/expense-categories",
        },
        {
          title: "Payment methods",
          url: "/settings/payment-methods",
        },
        {
          title: "Role & Permissions",
          url: "/settings/role-permissions",
        },
        {
          title: "System Users",
          url: "/settings/system-users",
        }
      );
    }
    
    const projects = [
      {
        title: "Settings",
        url: isAdmin ? "#" : "/settings/account-settings", // Direct link for non-admins
        icon: isAdmin ? Settings : UserCog, // Different icon for non-admins
        isActive: pathname.startsWith("/settings"),
        show: true, // Always show settings but content differs
        items: isAdmin ? settingsItems : undefined, // Only show dropdown for admins
      },
    ].filter(item => item.show);

    return {
      user: {
        name: user?.name,
        email: user?.email,
        profileUrl: user?.profileUrl,
        role: user?.role?.name || "User",
        isAdmin: isAdmin,
      },
      teams: [{ name: "Vison Genes", id: "4567" }].map((e) => {
        return {
          id: e.id,
          name: e.name,
          plan: "Enterprise",
        };
      }),
      navMain,
      projects,
    };
  }, [user, pathname, canAccessRoutes, isAdmin]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain title="Platform Management" items={data.navMain} />
        {data.projects.length > 0 && (
          <NavMain title="Configuration & settings" items={data.projects} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}