"use client";

import { Bell, Bolt, ChevronsUpDown, LogOut, UserCogIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import useModalState from "@/hooks/useModalState";
import LogoutModal from "../modal/LogoutModal";
import { useNavigate } from "react-router-dom";

const get2LetterInitials = (name: string) => {
  const [firstName, lastName] = name.split(" ");
  return `${firstName?.charAt(0)}${lastName?.charAt(0)}`;
};

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    profileUrl: string;
    role: string | { name: string } | null;
    group?: { name: string } | null;
    isAdmin?: boolean;
  };
}) {
  const { isMobile } = useSidebar();
  const logoutModal = useModalState();
  const navigate = useNavigate();

  const isAdmin = user?.isAdmin === true;

  // Get the role display name - if user is admin, show "Admin", otherwise show their role
  const getRoleDisplayName = () => {
    if (isAdmin) {
      return "Admin";
    }

    // Check if user has role and group information
    if (user.role && typeof user.role === 'object') {
      const roleName = user.role.name || "Unknown Role";
      const groupName = user.group?.name;

      return groupName
        ? `${roleName} (${groupName})`
        : roleName;
    }

    // Handle case where role is a string
    if (typeof user.role === 'string') {
      return user.role;
    }

    return "Member";
  };

  return (
    <>
      {" "}
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.profileUrl} alt={user.name} />
                  <AvatarFallback className="rounded-lg  text-primary border-primary !border uppercase">
                    {user.name && get2LetterInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{getRoleDisplayName()}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.profileUrl} alt={user.name} />
                    <AvatarFallback className="rounded-lg text-primary border-primary !border uppercase">
                      {user.name && get2LetterInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">
                      {getRoleDisplayName()}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate("/settings/account-settings")}>
                  <UserCogIcon size={16} />
                  Account Settings
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/settings/general-information")}>
                    <Bolt size={16} />
                    System Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Bell size={16} />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logoutModal.open()}>
                <LogOut size={16} />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <LogoutModal open={logoutModal.isOpen} onClose={logoutModal.close} />
    </>
  );
}