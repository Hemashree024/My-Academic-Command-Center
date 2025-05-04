
"use client";

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, BookCheck, Briefcase, FolderKanban, Award, GraduationCap, LogOut, BookOpenCheck, User, CaseLower } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const storedName = localStorage.getItem('loggedInUserName');
    if (!storedName) {
      router.replace('/');
      toast({
        title: "Authentication Required",
        description: "Please log in to access the dashboard.",
        variant: "destructive",
      });
    } else {
      setUserName(storedName);
      setIsLoading(false);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // Use router in dependency if it's used inside effect

  const handleLogout = () => {
    localStorage.removeItem('loggedInUserName');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/');
  };

   const getInitials = (name: string | null) => {
    if (!name) return <User className="h-5 w-5" />;
    return name
      .split(' ')
      .map((n) => n[0])
      .filter((_, i, arr) => i === 0 || i === arr.length - 1) // First and last initial
      .join('')
      .toUpperCase();
  };


  // Define menu items
  const menuItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", tooltip: "Dashboard" },
    { href: "/dashboard/assignments", icon: BookCheck, label: "Assignments", tooltip: "Assignments" },
    { href: "/dashboard/projects", icon: FolderKanban, label: "Personal Projects", tooltip: "Personal Projects" },
    { href: "/dashboard/college-projects", icon: Briefcase, label: "College Projects", tooltip: "College Projects" },
    { href: "/dashboard/placements", icon: CaseLower, label: "Placements", tooltip: "Placements" },
    { href: "/dashboard/certificates", icon: Award, label: "Certificates", tooltip: "Certificates" },
    { href: "/dashboard/courses", icon: GraduationCap, label: "Courses", tooltip: "Courses" },
  ];

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="p-3 border-b border-sidebar-border">
            {isLoading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-col space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                  <Avatar className="size-10 border border-sidebar-border/50">
                      {/* Use a placeholder or initials */}
                       {/* Add a generic user image or keep initials */}
                       <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=random`} alt={userName || 'User'} />
                      <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">{getInitials(userName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-semibold text-sidebar-foreground truncate">{userName}</span>
                      <span className="text-xs text-sidebar-foreground/70">Student Dashboard</span>
                  </div>
              </div>
            )}
        </SidebarHeader>

        <SidebarContent className="p-2 flex-1">
          <SidebarMenu>
             {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton href={item.href} tooltip={item.tooltip} isActive={pathname === item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
             ))}
          </SidebarMenu>
        </SidebarContent>

         <SidebarSeparator />

        <SidebarFooter className="p-2">
            <SidebarMenu>
                <SidebarMenuItem>
                     <SidebarMenuButton onClick={handleLogout} tooltip="Logout"> {/* No href here */}
                        <LogOut />
                        <span>Logout</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="p-4 md:p-6 transition-all duration-300 ease-in-out">
         {/* Mobile Header */}
         <header className="mb-6 flex items-center justify-between md:hidden border-b pb-4">
             <div className="flex items-center gap-2">
                <BookOpenCheck className="h-6 w-6 text-primary" />
                <span className="font-semibold text-lg">NextUp</span>
             </div>
            <SidebarTrigger />
         </header>

         {/* Main Content Area */}
         {isLoading ? (
             <div className="space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-5 w-2/3" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => ( <Skeleton key={i} className="h-24 rounded-lg" /> ))}
                </div>
             </div>
         ) : (
            <div className="transition-opacity duration-300 ease-in-out">
                {children}
            </div>
         )}

      </SidebarInset>
    </SidebarProvider>
  );
}
