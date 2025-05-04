"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LayoutDashboard, BookCheck, Briefcase, FolderKanban, Award, GraduationCap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Task } from '@/types'; // For assignment count
import type { Project, CollegeProject } from '@/types'; // For project counts
import type { PlacementActivity } from '@/types'; // For placement count
import type { Certificate } from '@/types'; // For certificate count
import type { Course } from '@/types'; // For course count
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
    const [isLoading, setIsLoading] = useState(true);

     // Function to safely get data from localStorage
    const getData = <T,>(key: string): T[] => {
        if (typeof window === 'undefined') return []; // Avoid server-side access
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return [];
        }
    };


    useEffect(() => {
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

            // Fetch data
            const assignments = getData<Task>(assignmentKey);
            const projects = getData<Project>(projectKey);
            const collegeProjects = getData<CollegeProject>(collegeProjectKey);
            const placements = getData<PlacementActivity>(placementKey);
            const certificates = getData<Certificate>(certificateKey);
            const courses = getData<Course>(courseKey);

            // Calculate stats
             const upcomingAssignments = assignments.filter(a => !a.completed && new Date(a.dueDate) >= new Date()).length;
             const activeProjects = projects.filter(p => p.status === 'In Progress').length;
             const activeCollegeProjects = collegeProjects.filter(p => p.status === 'In Progress').length;
             const activePlacements = placements.filter(p => ['Applied', 'Interviewing'].includes(p.status)).length;
             const activeCourses = courses.filter(c => c.status === 'In Progress').length;


            const overviewStats: Stat[] = [
              { title: "Upcoming Assignments", value: upcomingAssignments, icon: BookCheck, href: "/dashboard/assignments", description: "Due soon" },
              { title: "Active Personal Projects", value: activeProjects, icon: FolderKanban, href: "/dashboard/projects", description: "In progress" },
              { title: "Active College Projects", value: activeCollegeProjects, icon: Briefcase, href: "/dashboard/college-projects", description: "In progress" },
              { title: "Active Placements", value: activePlacements, icon: Briefcase /* Change Icon */, href: "/dashboard/placements", description: "Applications/Interviews" },
              { title: "Total Certificates", value: certificates.length, icon: Award, href: "/dashboard/certificates", description: "Earned" },
              { title: "Courses In Progress", value: activeCourses, icon: GraduationCap, href: "/dashboard/courses", description: "Currently learning" },
            ];

            setStats(overviewStats);
        }
         setIsLoading(false); // Data loading finished
    }, []); // Run only once on mount


  return (
    <div className="space-y-8">
      {isLoading ? (
        <>
          <Skeleton className="h-10 w-1/2 rounded-lg" />
          <Skeleton className="h-5 w-3/4 rounded" />
        </>
      ) : (
         <>
             <h1 className="text-3xl font-bold text-primary tracking-tight">
                Welcome back, {userName ? userName : 'Student'}!
             </h1>
              <p className="text-lg text-muted-foreground">Here's a quick overview of your academic activities.</p>
         </>
      )}


      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
            [...Array(6)].map((_, i) => (
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
            ))
        ) : (
            stats.map((stat) => (
              <Link href={stat.href} key={stat.title} passHref>
                 <Card className="shadow-sm border border-border/30 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-base font-medium text-muted-foreground group-hover:text-primary transition-colors">{stat.title}</CardTitle>
                      <stat.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                    {/* Optional: Add a footer link */}
                    {/* <CardFooter className="pt-4 border-t mt-4 group-hover:bg-accent/50 transition-colors">
                       <p className="text-xs text-primary flex items-center gap-1">
                          View Details <ArrowRight className="h-3 w-3" />
                       </p>
                    </CardFooter> */}
                 </Card>
              </Link>
            ))
        )}
      </div>

      {/* Optional: Add more dashboard widgets here, e.g., recent activity, upcoming deadlines */}
      {/* Example Placeholder */}
       {/* <Card className="mt-8 shadow-sm border border-border/30">
         <CardHeader>
           <CardTitle>Recent Activity</CardTitle>
           <CardDescription>Latest updates across your dashboard.</CardDescription>
         </CardHeader>
         <CardContent>
           <p className="text-muted-foreground italic">No recent activity to display.</p>
         </CardContent>
       </Card> */}
    </div>
  );
}
