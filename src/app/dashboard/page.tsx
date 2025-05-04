"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LayoutDashboard, BookCheck, Briefcase, FolderKanban, Award, GraduationCap } from 'lucide-react';
import Link from 'next/link';

// Dummy data structure - replace with actual data fetching later
const overviewStats = [
  { title: "Assignments Due", value: 5, icon: BookCheck, href: "/dashboard/assignments" },
  { title: "Active Projects", value: 2, icon: FolderKanban, href: "/dashboard/projects" },
  { title: "Placement Activities", value: 1, icon: Briefcase, href: "/dashboard/placements" },
  { title: "Certificates", value: 8, icon: Award, href: "/dashboard/certificates" },
  { title: "Enrolled Courses", value: 4, icon: GraduationCap, href: "/dashboard/courses" },
  { title: "College Projects", value: 3, icon: Briefcase, href: "/dashboard/college-projects" },
];

export default function DashboardPage() {
    const [userName, setUserName] = React.useState<string | null>(null);

    React.useEffect(() => {
        // Fetch username from local storage on client-side
        const storedName = localStorage.getItem('loggedInUserName');
        if (storedName) {
            setUserName(storedName);
        }
    }, []);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">
        Welcome back, {userName ? userName : 'Student'}!
      </h1>
      <p className="text-muted-foreground">Here's a quick overview of your college activities.</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {overviewStats.map((stat) => (
          <Link href={stat.href} key={stat.title} passHref>
             <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                   {/* Add more context if needed, e.g., "due this week" */}
                  {/* <p className="text-xs text-muted-foreground">+2 from last week</p> */}
                </CardContent>
             </Card>
          </Link>
        ))}
      </div>

      {/* You can add more dashboard widgets here, e.g., recent activity, upcoming deadlines */}
       {/* Example: Upcoming Deadlines */}
       {/* <Card>
         <CardHeader>
           <CardTitle>Upcoming Deadlines</CardTitle>
           <CardDescription>Assignments and projects due soon.</CardDescription>
         </CardHeader>
         <CardContent>
           {/* List upcoming items *\/}
           <p className="text-muted-foreground italic">No upcoming deadlines.</p>
         </CardContent>
       </Card> */}
    </div>
  );
}
