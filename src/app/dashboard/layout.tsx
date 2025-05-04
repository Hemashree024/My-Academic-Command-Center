"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, BookCheck, Briefcase, FolderKanban, Award, GraduationCap, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userName, setUserName] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const storedName = localStorage.getItem('loggedInUserName');
    if (!storedName) {
      router.replace('/'); // Redirect to login if no name found
      toast({
        title: "Authentication Required",
        description: "Please log in to access the dashboard.",
        variant: "destructive",
      });
    } else {
      setUserName(storedName);
      setIsLoading(false);
    }
  }, [router, toast]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUserName');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/');
  };

  if (isLoading) {
    // Optional: Show a loading indicator while checking auth state
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
                <Avatar className="size-10">
                    <AvatarImage src={`https://avatar.vercel.sh/${userName?.replace(/\s+/g, '-').toLowerCase() || 'user'}.png`} alt={userName || 'User'} />
                    <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-base font-semibold text-sidebar-foreground">{userName}</span>
                    <span className="text-xs text-sidebar-foreground/70">Student</span>
                </div>
            </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="/dashboard" tooltip="Dashboard" isActive={router.pathname === '/dashboard'}>
                <LayoutDashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/dashboard/assignments" tooltip="Assignments" isActive={router.pathname === '/dashboard/assignments'}>
                <BookCheck />
                <span>Assignments</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/dashboard/projects" tooltip="Projects" isActive={router.pathname === '/dashboard/projects'}>
                <FolderKanban />
                <span>Projects</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton href="/dashboard/college-projects" tooltip="College Projects" isActive={router.pathname === '/dashboard/college-projects'}>
                <Briefcase /> {/* Using Briefcase as stand-in */}
                <span>College Projects</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/dashboard/placements" tooltip="Placements" isActive={router.pathname === '/dashboard/placements'}>
                <Briefcase />
                <span>Placements</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/dashboard/certificates" tooltip="Certificates" isActive={router.pathname === '/dashboard/certificates'}>
                <Award />
                <span>Certificates</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/dashboard/courses" tooltip="Courses" isActive={router.pathname === '/dashboard/courses'}>
                <GraduationCap />
                <span>Courses</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
                <LogOut />
                <span>Logout</span>
            </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="p-4 md:p-6">
         <header className="mb-6 flex items-center justify-between">
            <div className="md:hidden"> {/* Show trigger only on mobile */}
                <SidebarTrigger />
            </div>
            {/* Add breadcrumbs or other header content here if needed */}
         </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
