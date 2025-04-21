import { AppSidebar } from "@/components/ui/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Link, Outlet, useMatches } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import { useAuth } from "@/context/auth.context";

const languages = [
  { value: "s1", label: "Kinyanrwanda", flag: "🇷🇼" },
  { value: "s2", label: "English", flag: "🇬🇧" },
  { value: "s3", label: "French", flag: "🇲🇫" },
];

export default function DashboardLayout() {
  const {user}=useAuth()
  const matches = useMatches();

  useEffect(() => {
    // Apply overflow-hidden to body when component mounts
    document.body.style.overflow = "hidden";

    // Cleanup function to remove overflow-hidden when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  let crumbs = matches
    // @ts-ignore
    .filter((match) => Boolean(match.handle?.crumb))
    .map((match) => ({
      // @ts-ignore
      crumb: match.handle.crumb(match.data),
      pathname: "/dashboard",
    }));

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-x-auto bg-slate-100">
        <header className="flex sticky top-0 z-50 bg-white h-14 justify-between border-b shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {crumbs.map((crumb, index) => {
                  const isLast = index === crumbs.length - 1;
                  return isLast ? (
                    <BreadcrumbItem>
                      <BreadcrumbPage>{crumb.crumb}</BreadcrumbPage>
                    </BreadcrumbItem>
                  ) : (
                    <>
                      <BreadcrumbItem>
                        <Link to={crumb.pathname}>{crumb.crumb}</Link>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                    </>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-5">
            <Select defaultValue="s2">
              <SelectTrigger
                id="select-37"
                className="[&>span]:flex h-9 [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0 [&>span_svg]:text-muted-foreground/80"
              >
                <SelectValue placeholder="Select framework" />
              </SelectTrigger>
              <SelectContent className="[&_*[role=option]>span>svg]:shrink-0 [&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
                {languages.map((ln) => (
                  <>
                    <SelectItem key={ln.value} value={ln.value}>
                      <span className="text-lg leading-none">{ln.flag}</span>{" "}
                      <span className="truncate">{ln.label}</span>
                    </SelectItem>
                  </>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>
        {/* <ScrollArea className="h-full flex-1 w-full overflow-x-auto"> */}
        <div className="flex flex-1 flex-col gap-4 pt-0 p-2">
          <Outlet />
        </div>
        {/* </ScrollArea> */}
      </SidebarInset>
    </SidebarProvider>
  );
}
