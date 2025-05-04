"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Link as LinkIcon, CalendarDays } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

interface PlacementActivity {
  id: string;
  company: string;
  role: string;
  status: 'Applied' | 'Interviewing' | 'Offer Received' | 'Offer Accepted' | 'Offer Declined' | 'Rejected' | 'Withdrawn';
  applicationDate: string; // ISO String
  interviewDate?: string; // ISO String
  notes?: string;
  link?: string; // Job posting link
}

export default function PlacementsPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const storageKey = userName ? `${userName}-placements` : 'placements';
  const [activities, setActivities] = useLocalStorage<PlacementActivity[]>(storageKey, []);
  const [editingActivity, setEditingActivity] = useState<PlacementActivity | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  // Form state
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<PlacementActivity['status']>('Applied');
  const [applicationDate, setApplicationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [link, setLink] = useState('');


  useEffect(() => {
    setMounted(true);
    const storedName = localStorage.getItem('loggedInUserName');
    setUserName(storedName);
  }, []);

  useEffect(() => {
    if (editingActivity) {
      setCompany(editingActivity.company);
      setRole(editingActivity.role);
      setStatus(editingActivity.status);
      setApplicationDate(editingActivity.applicationDate.split('T')[0]);
      setInterviewDate(editingActivity.interviewDate ? editingActivity.interviewDate.split('T')[0] : '');
      setNotes(editingActivity.notes || '');
      setLink(editingActivity.link || '');
      setIsFormOpen(true);
    } else {
      resetForm();
    }
  }, [editingActivity]);

   const resetForm = () => {
     setCompany('');
     setRole('');
     setStatus('Applied');
     setApplicationDate(new Date().toISOString().split('T')[0]);
     setInterviewDate('');
     setNotes('');
     setLink('');
     setEditingActivity(null);
   };

   const handleFormSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!company.trim() || !role.trim()) {
        toast({ title: "Error", description: "Company and Role are required.", variant: "destructive" });
        return;
     };

     // Basic URL validation (optional)
     let validLink = link.trim();
     if (validLink && !validLink.startsWith('http://') && !validLink.startsWith('https://')) {
        validLink = 'https://' + validLink; // Add protocol if missing
     }


     const activityData: Omit<PlacementActivity, 'id'> = {
        company: company.trim(),
        role: role.trim(),
        status,
        applicationDate: new Date(applicationDate).toISOString(),
        interviewDate: interviewDate ? new Date(interviewDate).toISOString() : undefined,
        notes: notes.trim(),
        link: validLink || undefined,
     };

     if (editingActivity) {
       const updatedActivity: PlacementActivity = { ...activityData, id: editingActivity.id };
       setActivities(prev => prev.map(a => a.id === updatedActivity.id ? updatedActivity : a));
       toast({ title: "Placement Updated", description: `${updatedActivity.company} - ${updatedActivity.role} updated.` });
     } else {
       const newActivity: PlacementActivity = { ...activityData, id: crypto.randomUUID() };
       setActivities(prev => [...prev, newActivity]);
       toast({ title: "Placement Added", description: `${newActivity.company} - ${newActivity.role} added.` });
     }

     resetForm();
     setIsFormOpen(false);
   };

   const handleDeleteActivity = (id: string) => {
     const activityToDelete = activities.find(a => a.id === id);
     setActivities(prev => prev.filter(a => a.id !== id));
      if (activityToDelete) {
         toast({ title: "Placement Deleted", description: `${activityToDelete.company} - ${activityToDelete.role} deleted.`, variant: "destructive" });
      }
   };

   const handleEditClick = (activity: PlacementActivity) => {
       setEditingActivity(activity);
   };

   const handleCancelEdit = () => {
        resetForm();
        setIsFormOpen(false);
   };

   // Sort activities (e.g., by application date descending)
   const sortedActivities = [...activities].sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime());


  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Placements</h1>
          <p className="text-lg text-muted-foreground">Track your job applications and interviews.</p>
        </div>
        <Button onClick={() => { setEditingActivity(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Application
        </Button>
      </header>

       {isFormOpen && (
         <Card>
           <CardHeader>
             <CardTitle>{editingActivity ? 'Edit Application' : 'Add New Application'}</CardTitle>
           </CardHeader>
           <form onSubmit={handleFormSubmit}>
             <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="plac-company">Company</Label>
                        <Input id="plac-company" value={company} onChange={e => setCompany(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="plac-role">Role</Label>
                        <Input id="plac-role" value={role} onChange={e => setRole(e.target.value)} required />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="plac-appDate">Application Date</Label>
                         <Input id="plac-appDate" type="date" value={applicationDate} onChange={e => setApplicationDate(e.target.value)} required />
                     </div>
                     <div>
                         <Label htmlFor="plac-interviewDate">Next Interview Date (Optional)</Label>
                         <Input id="plac-interviewDate" type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} />
                     </div>
                 </div>
                <div>
                    <Label htmlFor="plac-status">Status</Label>
                     <select
                         id="plac-status"
                         value={status}
                         onChange={e => setStatus(e.target.value as PlacementActivity['status'])}
                         className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                     >
                         <option value="Applied">Applied</option>
                         <option value="Interviewing">Interviewing</option>
                         <option value="Offer Received">Offer Received</option>
                         <option value="Offer Accepted">Offer Accepted</option>
                         <option value="Offer Declined">Offer Declined</option>
                         <option value="Rejected">Rejected</option>
                         <option value="Withdrawn">Withdrawn</option>
                     </select>
                 </div>
                 <div>
                     <Label htmlFor="plac-link">Job Posting Link (Optional)</Label>
                     <Input id="plac-link" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
                 </div>
                 <div>
                     <Label htmlFor="plac-notes">Notes (Optional)</Label>
                     <Textarea id="plac-notes" value={notes} onChange={e => setNotes(e.target.value)} />
                 </div>
             </CardContent>
             <CardFooter className="flex justify-end space-x-2">
               <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
               <Button type="submit">{editingActivity ? 'Save Changes' : 'Add Application'}</Button>
             </CardFooter>
           </form>
         </Card>
       )}

       {mounted && userName && (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedActivities.length > 0 ? sortedActivities.map(activity => (
                 <Card key={activity.id} className="flex flex-col">
                     <CardHeader>
                         <div className="flex justify-between items-start gap-2">
                             <div>
                                 <CardTitle>{activity.company}</CardTitle>
                                 <CardDescription>{activity.role}</CardDescription>
                             </div>
                              <Badge
                                variant={activity.status.startsWith('Offer') ? 'default' : activity.status === 'Interviewing' ? 'secondary' : 'outline'}
                                className={cn(
                                    activity.status === 'Offer Received' || activity.status === 'Offer Accepted' ? 'bg-success text-success-foreground' : '',
                                    activity.status === 'Rejected' || activity.status === 'Offer Declined' ? 'bg-destructive text-destructive-foreground' : ''
                                )}
                                >
                                 {activity.status}
                             </Badge>
                         </div>
                         <div className="text-xs text-muted-foreground pt-2 space-y-1">
                            <p className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> Applied: {new Date(activity.applicationDate).toLocaleDateString()}</p>
                             {activity.interviewDate && <p className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> Interview: {new Date(activity.interviewDate).toLocaleDateString()}</p>}
                         </div>
                     </CardHeader>
                     <CardContent className="flex-grow space-y-2">
                         {activity.notes && <p className="text-sm text-muted-foreground line-clamp-3">{activity.notes}</p>}
                         {activity.link && (
                             <Link href={activity.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                 <LinkIcon className="h-3 w-3" /> Job Posting
                             </Link>
                         )}
                     </CardContent>
                     <CardFooter className="flex justify-end gap-2">
                         <Button variant="ghost" size="icon" onClick={() => handleEditClick(activity)}>
                             <Pencil className="h-4 w-4" />
                         </Button>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Application?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will permanently delete the application for {activity.role} at {activity.company}.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteActivity(activity.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                     </CardFooter>
                 </Card>
             )) : (
                 <p className="text-muted-foreground italic md:col-span-2 lg:col-span-3 text-center">No placement activities tracked yet.</p>
             )}
         </div>
       )}
    </div>
  );
}

// Helper cn function
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
