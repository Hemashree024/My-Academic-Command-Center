
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LayoutDashboard, BookCheck, Briefcase, FolderKanban, Award, GraduationCap, ArrowRight, CaseLower } from 'lucide-react'; // Added CaseLower
import Link from 'next/link';
import type { Task, Project, CollegeProject, PlacementActivity, Certificate, Course } from '@/types'; // Consolidate type imports
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

interface Stat {
  title: string;
  value: number | string; // Can be number or loading indicator
  icon: React.ElementType;
  href: string;
  description?: string;
}

export default function DashboardPage() {
    const [userName, setUserName] = useState<string | null>(null);
    const [stats, setStats] = useState<Stat[]>([]);
    const [isClient, setIsClient] = useState(false); // State to track client mount

     // Function to safely get data from localStorage
    const getData = <T,>(key: string): T[] => {
        // Check window existence is redundant now due to isClient state
        try {
            // Ensure this runs only on the client
            if (typeof window !== 'undefined') {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : [];
            }
            return []; // Return empty array if not on client
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return [];
        }
    };


    useEffect(() => {
        // Ensure this runs only on the client
        setIsClient(true);
        // Fetch username and data from local storage on client-side
        const storedName = localStorage.getItem('loggedInUserName');
        if (storedName) {
            setUserName(storedName);

            // Construct keys based on username
            const assignmentKey = `${storedName}-assignments`;
            const projectKey = `${storedName}-projects`;
            const collegeProjectKey = `${storedName}-college-projects`;
            const placementKey = `${storedName}-placements`;
            const certificateKey = `${storedName}-certificates`;
            const courseKey = `${storedName}-courses`;

            // Fetch data - ensure getData is called client-side
            const assignments = getData<Task>(assignmentKey);
            const projects = getData<Project>(projectKey);
            const collegeProjects = getData<CollegeProject>(collegeProjectKey);
            const placements = getData<PlacementActivity>(placementKey);
            const certificates = getData<Certificate>(certificateKey);
            const courses = getData<Course>(courseKey);

            // Calculate stats
             // Count only assignments that are not completed AND due date is today or in the future
            const upcomingAssignments = assignments.filter(a => {
                 if (a.completed) return false;
                 try {
                     const dueDate = new Date(a.dueDate);
                     const today = new Date();
                     today.setHours(0, 0, 0, 0); // Set today to the beginning of the day
                     dueDate.setHours(0,0,0,0); // Set due date to the beginning of the day
                     return dueDate >= today;
                 } catch {
                     return false; // Invalid date format
                 }
             }).length;
             const activeProjects = projects.filter(p => p.status === 'In Progress').length;
             const activeCollegeProjects = collegeProjects.filter(p => p.status === 'In Progress').length;
             const activePlacements = placements.filter(p => ['Applied', 'Interviewing'].includes(p.status)).length;
             const activeCourses = courses.filter(c => c.status === 'In Progress').length;


            const overviewStats: Stat[] = [
              { title: "Upcoming Assignments", value: upcomingAssignments, icon: BookCheck, href: "/dashboard/assignments", description: "Due soon or today" },
              { title: "Active Personal Projects", value: activeProjects, icon: FolderKanban, href: "/dashboard/projects", description: "In progress" },
              { title: "Active College Projects", value: activeCollegeProjects, icon: Briefcase, href: "/dashboard/college-projects", description: "In progress" },
              { title: "Active Placements", value: activePlacements, icon: CaseLower, href: "/dashboard/placements", description: "Applications/Interviews" },
              { title: "Total Certificates", value: certificates.length, icon: Award, href: "/dashboard/certificates", description: "Earned" },
              { title: "Courses In Progress", value: activeCourses, icon: GraduationCap, href: "/dashboard/courses", description: "Currently learning" },
            ];

            setStats(overviewStats);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isClient]); // Rerun when isClient becomes true

  // Render skeleton or null during SSR and initial client render before mount
  if (!isClient) {
     return (
         <div className="space-y-8">
             <Skeleton className="h-10 w-1/2 rounded-lg mb-2" />
             <Skeleton className="h-5 w-3/4 rounded" />
             <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                 {[...Array(6)].map((_, i) => (
                    <Card key={i} className="shadow-sm border border-border/30">
                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <Skeleton className="h-5 w-2/3 rounded" />
                             <Skeleton className="h-6 w-6 rounded-sm" />
                         </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-1/4 mb-2 rounded" />
                            <Skeleton className="h-4 w-1/2 rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
         </div>
     );
  }


  return (
    <div className="space-y-8">
         <>
             <h1 className="text-3xl font-bold text-primary tracking-tight">
                Welcome back, {userName ? userName : 'Student'}!
             </h1>
              <p className="text-lg text-muted-foreground">Here's a quick overview of your academic activities.</p>
         </>


      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <Link href={stat.href} key={stat.title} passHref>
                 <Card className="shadow-sm border border-border/30 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group flex flex-col h-full"> {/* Added flex classes */}
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-base font-medium text-muted-foreground group-hover:text-primary transition-colors">{stat.title}</CardTitle>
                      <stat.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent className="flex-grow"> {/* Added flex-grow */}
                      <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                    {/* Footer with arrow (optional, adds visual cue) */}
                    <div className="p-4 pt-2 mt-auto text-right">
                       <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                 </Card>
              </Link>
            ))}
      </div>

      {/* Optional: Add more dashboard widgets here, e.g., recent activity, upcoming deadlines */}
    </div>
  );
}
