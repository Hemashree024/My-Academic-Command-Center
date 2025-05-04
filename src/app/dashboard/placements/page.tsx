
"use client";

import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Link as LinkIcon, CalendarDays, Info } from 'lucide-react'; // Added Info
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import type { PlacementActivity } from '@/types'; // Import specific type
import { cn } from '@/lib/utils'; // Import cn
import { format } from 'date-fns'; // Import date-fns

// Define terminal statuses that signify completion
const TERMINAL_PLACEMENT_STATUSES: PlacementActivity['status'][] = [
    'Offer Accepted', 'Offer Declined', 'Rejected', 'Withdrawn'
];

export default function PlacementsPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const storageKey = userName ? `${userName}-placements` : 'placements-fallback'; // Fallback key
  const [activities, setActivities] = useLocalStorage<PlacementActivity[]>(storageKey, []);
  const [editingActivity, setEditingActivity] = useState<PlacementActivity | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isClient, setIsClient] = useState(false); // State to track client mount
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
    setIsClient(true); // Component has mounted
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
       // Only reset if not currently editing
      if (!isFormOpen) resetForm();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingActivity, isFormOpen]);

   const resetForm = () => {
     setCompany('');
     setRole('');
     setStatus('Applied');
     setApplicationDate(new Date().toISOString().split('T')[0]);
     setInterviewDate('');
     setNotes('');
     setLink('');
     setEditingActivity(null); // Explicitly clear editing state
   };

   const handleFormSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!company.trim() || !role.trim()) {
        toast({ title: "Error", description: "Company and Role are required.", variant: "destructive" });
        return;
     };

     let validLink = link.trim();
     if (validLink && !validLink.startsWith('http://') && !validLink.startsWith('https://')) {
        validLink = 'https://' + validLink;
     }

     const isCompleted = TERMINAL_PLACEMENT_STATUSES.includes(status);

     const activityData: Omit<PlacementActivity, 'id'> = {
        company: company.trim(),
        role: role.trim(),
        status,
        applicationDate: new Date(applicationDate).toISOString(),
        interviewDate: interviewDate ? new Date(interviewDate).toISOString() : undefined,
        notes: notes.trim() || undefined, // Store undefined if empty
        link: validLink || undefined, // Store undefined if empty
        completed: isCompleted, // Sync completed status
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
       // Form opens via useEffect
   };

   const handleCancelEdit = () => {
        resetForm();
        setIsFormOpen(false);
   };

   // Toggle completion: Sets status to 'Withdrawn' if completing, 'Applied' if uncompleting
   const handleToggleComplete = (id: string) => {
     const activityToUpdate = activities.find(a => a.id === id);
     if (!activityToUpdate) return;

     const wasCompleted = activityToUpdate.completed;
     // Define a sensible default status when toggling completion
     const newStatus = wasCompleted ? 'Applied' : 'Withdrawn'; // Or Rejected? Choose one.

     setActivities(prevActivities =>
       prevActivities.map(a =>
         a.id === id ? { ...a, completed: !wasCompleted, status: newStatus } : a
       )
     );

     toast({
       title: `Placement ${wasCompleted ? 'Re-Opened' : 'Marked Concluded'}`,
       description: `${activityToUpdate.company} - ${activityToUpdate.role} status set to ${newStatus}.`,
       variant: wasCompleted ? 'default' : 'success',
     });
   };

   // Sort activities: Active first, then completed. Within groups, by application date desc.
   const sortedActivities = useMemo(() => {
     return [...activities].sort((a, b) => {
         if (a.completed !== b.completed) {
            return a.completed ? 1 : -1; // Active first
         }
         // Then sort by application date descending
        return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
     });
   }, [activities]);

   // Separate into active and completed *after* sorting
   const activeActivities = sortedActivities.filter(a => !a.completed);
   const completedActivities = sortedActivities.filter(a => a.completed);

  // Render skeleton or null during SSR and initial client render before mount
   if (!isClient) {
     return (
       <div className="space-y-8">
         <header className="flex justify-between items-center">
           <div>
             <Skeleton className="h-9 w-40 mb-2" />
             <Skeleton className="h-6 w-72" />
           </div>
           <Skeleton className="h-10 w-40 rounded-md" />
         </header>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-60 rounded-lg" />)}
         </div>
       </div>
     );
   }


  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Placements</h1>
          <p className="text-lg text-muted-foreground">Track your job applications and interviews.</p>
        </div>
         {userName && ( // Only show button if user is identified
           <Button onClick={() => { setEditingActivity(null); resetForm(); setIsFormOpen(true); }}>
             <Plus className="mr-2 h-4 w-4" /> Add Application
           </Button>
         )}
      </header>

       {isFormOpen && (
         <Card className="border border-border/50 shadow-sm">
           <CardHeader>
             <CardTitle className="text-xl text-primary">{editingActivity ? 'Edit Application' : 'Add New Application'}</CardTitle>
           </CardHeader>
           <form onSubmit={handleFormSubmit}>
             <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="plac-company">Company</Label>
                        <Input id="plac-company" value={company} onChange={e => setCompany(e.target.value)} required className="h-10 mt-1"/>
                    </div>
                    <div>
                        <Label htmlFor="plac-role">Role</Label>
                        <Input id="plac-role" value={role} onChange={e => setRole(e.target.value)} required className="h-10 mt-1"/>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="plac-appDate">Application Date</Label>
                         <Input id="plac-appDate" type="date" value={applicationDate} onChange={e => setApplicationDate(e.target.value)} required className="h-10 mt-1"/>
                     </div>
                     <div>
                         <Label htmlFor="plac-interviewDate">Next Interview Date (Optional)</Label>
                         <Input id="plac-interviewDate" type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} className="h-10 mt-1"/>
                     </div>
                 </div>
                <div>
                    <Label htmlFor="plac-status">Status</Label>
                     <Select value={status} onValueChange={(value) => setStatus(value as PlacementActivity['status'])}>
                         <SelectTrigger className="w-full h-10 mt-1">
                             <SelectValue placeholder="Select status" />
                         </SelectTrigger>
                         <SelectContent>
                             <SelectItem value="Applied">Applied</SelectItem>
                             <SelectItem value="Interviewing">Interviewing</SelectItem>
                             <SelectItem value="Offer Received">Offer Received</SelectItem>
                             <SelectItem value="Offer Accepted">Offer Accepted</SelectItem>
                             <SelectItem value="Offer Declined">Offer Declined</SelectItem>
                             <SelectItem value="Rejected">Rejected</SelectItem>
                             <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                         </SelectContent>
                     </Select>
                 </div>
                 <div>
                     <Label htmlFor="plac-link">Job Posting Link (Optional)</Label>
                     <Input id="plac-link" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="h-10 mt-1"/>
                 </div>
                 <div>
                     <Label htmlFor="plac-notes">Notes (Optional)</Label>
                     <Textarea id="plac-notes" value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 min-h-[60px]"/>
                 </div>
                  {/* Optional: Show derived completed state in form */}
                 {/* <div className="flex items-center space-x-2">
                    <Checkbox id="plac-completed-form" checked={TERMINAL_PLACEMENT_STATUSES.includes(status)} disabled />
                    <Label htmlFor="plac-completed-form" className="text-muted-foreground">Completed (based on status)</Label>
                 </div> */}
             </CardContent>
             <CardFooter className="flex justify-end space-x-2 bg-secondary/20 p-4 border-t">
               <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
               <Button type="submit">{editingActivity ? 'Save Changes' : 'Add Application'}</Button>
             </CardFooter>
           </form>
         </Card>
       )}

       {userName ? ( // Only render list if user is identified
         <>
           {/* Active Activities */}
           <div>
             <h2 className="text-2xl font-semibold mb-4 text-primary border-b pb-2">Active Applications</h2>
             {activeActivities.length > 0 ? (
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {activeActivities.map(activity => (
                   <Card key={activity.id} className="flex flex-col border border-border/50 shadow-sm transition-shadow duration-200 hover:shadow-lg hover:border-primary/30">
                     <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-4 pr-4 pl-4">
                         <div className="flex items-center h-6 mt-1">
                           <Checkbox
                             id={`plac-check-${activity.id}`}
                             checked={activity.completed}
                             onCheckedChange={() => handleToggleComplete(activity.id)}
                             aria-label={`Mark application for ${activity.role} at ${activity.company} as concluded`}
                             className="peer size-5 rounded border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                           />
                         </div>
                         <div className="grid gap-0.5 flex-1">
                           <div className="flex justify-between items-start gap-2">
                               <div>
                                   <CardTitle className="text-lg peer-data-[state=checked]:line-through peer-data-[state=checked]:text-muted-foreground">
                                       {activity.company}
                                   </CardTitle>
                                   <CardDescription className="peer-data-[state=checked]:line-through peer-data-[state=checked]:text-muted-foreground">
                                       {activity.role}
                                   </CardDescription>
                               </div>
                                <Badge
                                  variant={activity.status.startsWith('Offer') ? 'default' : activity.status === 'Interviewing' ? 'secondary' : 'outline'}
                                  className={cn(
                                      'capitalize whitespace-nowrap',
                                      activity.status === 'Offer Received' || activity.status === 'Offer Accepted' ? 'bg-success text-success-foreground' : '',
                                      activity.status === 'Rejected' || activity.status === 'Offer Declined' || activity.status === 'Withdrawn' ? 'bg-destructive text-destructive-foreground' : '',
                                       activity.status === 'Interviewing' && 'bg-secondary text-secondary-foreground',
                                       activity.status === 'Applied' && 'border-primary text-primary'
                                  )}
                                  >
                                   {activity.status}
                               </Badge>
                           </div>
                           <div className="text-xs text-muted-foreground pt-2 space-y-1">
                              <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Applied: {format(new Date(activity.applicationDate), 'PPP')}</p>
                               {activity.interviewDate && <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Interview: {format(new Date(activity.interviewDate), 'PPP')}</p>}
                           </div>
                         </div>
                     </CardHeader>
                     <CardContent className="flex-grow space-y-3 pt-2 pb-4 pl-12 pr-4">
                         {activity.notes && <p className="text-sm text-muted-foreground line-clamp-3">{activity.notes}</p>}
                         {activity.link && (
                             <Link href={activity.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1.5">
                                 <LinkIcon className="h-3.5 w-3.5" /> Job Posting
                             </Link>
                         )}
                     </CardContent>
                     <CardFooter className="flex justify-end gap-2 p-3 pt-0 border-t bg-secondary/20">
                         <Button variant="ghost" size="icon" onClick={() => handleEditClick(activity)} aria-label={`Edit application for ${activity.role} at ${activity.company}`}>
                             <Pencil className="h-4 w-4" />
                         </Button>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" aria-label={`Delete application for ${activity.role} at ${activity.company}`}>
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Application?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will permanently delete the application for {activity.role} at {activity.company}. This action cannot be undone.
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
                 ))}
               </div>
             ) : (
               <div className="col-span-full text-center py-10 px-4 border border-dashed rounded-lg">
                 <Info className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                 <p className="text-muted-foreground italic">No active placement activities tracked yet.</p>
               </div>
             )}
           </div>

           {/* Completed Activities */}
           {completedActivities.length > 0 && (
             <div className="mt-12">
               <h2 className="text-2xl font-semibold mb-4 text-success border-b pb-2">Concluded Applications</h2>
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {completedActivities.map(activity => (
                   <Card key={activity.id} className="flex flex-col border border-border/40 bg-card/80 shadow-sm opacity-80 hover:opacity-100 transition-opacity duration-200">
                     <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-4 pr-4 pl-4">
                         <div className="flex items-center h-6 mt-1">
                           <Checkbox
                             id={`plac-check-${activity.id}`}
                             checked={activity.completed}
                             onCheckedChange={() => handleToggleComplete(activity.id)}
                             aria-label={`Mark application for ${activity.role} at ${activity.company} as active`}
                             className="peer size-5 rounded border-success data-[state=checked]:bg-success data-[state=checked]:text-primary-foreground data-[state=checked]:border-success"
                           />
                         </div>
                         <div className="grid gap-0.5 flex-1">
                             <div className="flex justify-between items-start gap-2">
                                 <div>
                                     <CardTitle className="text-lg line-through text-muted-foreground">{activity.company}</CardTitle>
                                     <CardDescription className="line-through text-muted-foreground">{activity.role}</CardDescription>
                                 </div>
                                 <Badge
                                    variant='default' // Consistent variant for concluded
                                    className={cn(
                                        'capitalize whitespace-nowrap',
                                         activity.status === 'Offer Accepted' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground' // Color based on specific terminal status
                                    )}
                                  >
                                   {activity.status}
                                 </Badge>
                             </div>
                             <div className="text-xs text-muted-foreground pt-2 space-y-1">
                                 <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Applied: {format(new Date(activity.applicationDate), 'PPP')}</p>
                                  {activity.interviewDate && <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Interview: {format(new Date(activity.interviewDate), 'PPP')}</p>}
                             </div>
                         </div>
                     </CardHeader>
                      <CardContent className="flex-grow space-y-3 pt-2 pb-4 pl-12 pr-4">
                         {activity.notes && <p className="text-sm text-muted-foreground line-clamp-2 italic">{activity.notes}</p>}
                         {activity.link && (
                             <Link href={activity.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary/80 hover:underline flex items-center gap-1.5">
                                 <LinkIcon className="h-3.5 w-3.5" /> Job Posting
                             </Link>
                         )}
                     </CardContent>
                     <CardFooter className="flex justify-end gap-2 p-3 pt-0 border-t bg-secondary/10">
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" aria-label={`Delete concluded application for ${activity.role} at ${activity.company}`}>
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Concluded Application?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will permanently delete the application for {activity.role} at {activity.company}. This action cannot be undone.
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
                 ))}
               </div>
             </div>
           )}
         </>
       ) : (
           // Optional: Message if user isn't loaded yet
           <div className="text-center text-muted-foreground italic py-10">
               Loading placements...
           </div>
       )}
    </div>
  );
}
