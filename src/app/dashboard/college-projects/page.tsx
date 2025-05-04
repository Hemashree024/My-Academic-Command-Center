
"use client";

// This page is very similar to Personal Projects.
// Consider abstracting the Project management logic into a reusable component or hook
// if the requirements become more complex or diverge significantly.

import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Info } from 'lucide-react'; // Added Info icon
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
// import type { Task } from '@/types'; // Reuse Task type - Not needed if CollegeProject is defined
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import type { CollegeProject } from '@/types'; // Use specific type
import { cn } from '@/lib/utils'; // Import cn
import { format, isPast, isToday } from 'date-fns'; // Import date-fns

export default function CollegeProjectsPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const storageKey = userName ? `${userName}-college-projects` : 'college-projects-fallback'; // Fallback key
  const [projects, setProjects] = useLocalStorage<CollegeProject[]>(storageKey, []);
  const [editingProject, setEditingProject] = useState<CollegeProject | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isClient, setIsClient] = useState(false); // State to track client mount
  const { toast } = useToast();

  // Form state
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [course, setCourse] = useState('');
  const [teamMembersInput, setTeamMembersInput] = useState('');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<CollegeProject['status']>('Planning');

  useEffect(() => {
    setIsClient(true); // Component has mounted
    const storedName = localStorage.getItem('loggedInUserName');
    setUserName(storedName);
  }, []);

  useEffect(() => {
    if (editingProject) {
      setDescription(editingProject.description);
      setDetails(editingProject.details || '');
      setCourse(editingProject.course || '');
      setTeamMembersInput((editingProject.teamMembers || []).join(', '));
      setDueDate(editingProject.dueDate.split('T')[0]);
      setTagsInput(editingProject.tags.join(', '));
      setStatus(editingProject.status || 'Planning');
      setIsFormOpen(true);
    } else {
      // Only reset if not currently editing
       if (!isFormOpen) resetForm();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProject, isFormOpen]);

   const resetForm = () => {
     setDescription('');
     setDetails('');
     setCourse('');
     setTeamMembersInput('');
     setDueDate(new Date().toISOString().split('T')[0]);
     setTagsInput('');
     setStatus('Planning');
     setEditingProject(null); // Explicitly clear editing state
   };

   const handleFormSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!description.trim()) {
         toast({ title: "Error", description: "Project description is required.", variant: "destructive" });
         return;
     };

     const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
     const teamMembers = teamMembersInput.split(',').map(mem => mem.trim()).filter(mem => mem !== '');
     const isCompleted = ['Completed', 'Submitted', 'Graded'].includes(status || ''); // Check if considered completed

     const projectData: Omit<CollegeProject, 'id'> = {
        description: description.trim(),
        details: details.trim() || undefined, // Store undefined if empty
        course: course.trim() || undefined, // Store undefined if empty
        teamMembers: teamMembers.length > 0 ? teamMembers : undefined, // Store undefined if empty
        dueDate: new Date(dueDate).toISOString(),
        tags,
        status,
        completed: isCompleted, // Sync completed field
     };

     if (editingProject) {
       const updatedProject: CollegeProject = {
         ...projectData,
         id: editingProject.id,
       };
       setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
       toast({ title: "College Project Updated", description: `"${updatedProject.description}" updated.` });
     } else {
       const newProject: CollegeProject = {
         ...projectData,
         id: crypto.randomUUID(),
       };
       setProjects(prev => [...prev, newProject]);
       toast({ title: "College Project Added", description: `"${newProject.description}" added.` });
     }

     resetForm();
     setIsFormOpen(false);
   };

   const handleDeleteProject = (id: string) => {
     const projectToDelete = projects.find(p => p.id === id);
     setProjects(prev => prev.filter(p => p.id !== id));
      if (projectToDelete) {
         toast({ title: "College Project Deleted", description: `"${projectToDelete.description}" deleted.`, variant: "destructive" });
      }
   };

   const handleEditClick = (project: CollegeProject) => {
       setEditingProject(project);
       // Form opens via useEffect
   };

   const handleCancelEdit = () => {
        resetForm();
        setIsFormOpen(false);
   };

   // Toggle completion status - sets status to Completed/In Progress
   const handleToggleComplete = (id: string) => {
     const projectToUpdate = projects.find(p => p.id === id);
     if (!projectToUpdate) return;

     const wasCompleted = projectToUpdate.completed;
     const newStatus = wasCompleted ? 'In Progress' : 'Completed'; // Toggle between In Progress and Completed

     setProjects(prevProjects =>
       prevProjects.map(p =>
         p.id === id ? { ...p, completed: !wasCompleted, status: newStatus } : p
       )
     );

     toast({
       title: `Project ${wasCompleted ? 'Marked In Progress' : 'Marked Complete'}`,
       description: `"${projectToUpdate.description}" marked as ${newStatus.toLowerCase()}.`,
       variant: wasCompleted ? 'default' : 'success',
     });
   };


    // Sort projects: Incomplete first, then Completed. Within groups, by due date.
    const sortedProjects = useMemo(() => {
      return [...projects].sort((a, b) => {
          if (a.completed !== b.completed) {
             return a.completed ? 1 : -1; // Incomplete first
          }
          // Then sort by due date ascending
         return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }, [projects]);

     // Separate into upcoming and completed *after* sorting
    const upcomingProjects = sortedProjects.filter(p => !p.completed);
    const completedProjects = sortedProjects.filter(p => p.completed);

   // Render skeleton or null during SSR and initial client render before mount
   if (!isClient) {
     return (
       <div className="space-y-8">
         <header className="flex justify-between items-center">
           <div>
             <Skeleton className="h-9 w-56 mb-2" />
             <Skeleton className="h-6 w-72" />
           </div>
           <Skeleton className="h-10 w-44 rounded-md" />
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
          <h1 className="text-3xl font-bold text-primary mb-2">College Projects</h1>
          <p className="text-lg text-muted-foreground">Track your academic projects.</p>
        </div>
         {userName && ( // Only show button if user is identified
           <Button onClick={() => { setEditingProject(null); resetForm(); setIsFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add College Project
           </Button>
         )}
      </header>

       {isFormOpen && (
         <Card className="border border-border/50 shadow-sm">
           <CardHeader>
             <CardTitle className="text-xl text-primary">{editingProject ? 'Edit College Project' : 'Add New College Project'}</CardTitle>
           </CardHeader>
           <form onSubmit={handleFormSubmit}>
             <CardContent className="space-y-4">
               <div>
                 <Label htmlFor="cproj-description">Description</Label>
                 <Input id="cproj-description" value={description} onChange={e => setDescription(e.target.value)} required className="h-10 mt-1"/>
               </div>
                <div>
                 <Label htmlFor="cproj-course">Course (Optional)</Label>
                 <Input id="cproj-course" value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g., CS 465" className="h-10 mt-1"/>
               </div>
               <div>
                 <Label htmlFor="cproj-details">Details (Optional)</Label>
                 <Textarea id="cproj-details" value={details} onChange={e => setDetails(e.target.value)} className="mt-1 min-h-[60px]"/>
               </div>
                <div>
                 <Label htmlFor="cproj-team">Team Members (comma-separated, optional)</Label>
                 <Input id="cproj-team" value={teamMembersInput} onChange={e => setTeamMembersInput(e.target.value)} placeholder="e.g., Jane Doe, John Smith" className="h-10 mt-1"/>
               </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="cproj-dueDate">Due Date</Label>
                         <Input id="cproj-dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="h-10 mt-1"/>
                     </div>
                     <div>
                         <Label htmlFor="cproj-status">Status</Label>
                          <Select value={status} onValueChange={(value) => setStatus(value as CollegeProject['status'])}>
                             <SelectTrigger className="w-full h-10 mt-1">
                                 <SelectValue placeholder="Select status" />
                             </SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="Planning">Planning</SelectItem>
                                 <SelectItem value="In Progress">In Progress</SelectItem>
                                 <SelectItem value="Completed">Completed</SelectItem>
                                 <SelectItem value="Submitted">Submitted</SelectItem>
                                 <SelectItem value="Graded">Graded</SelectItem>
                             </SelectContent>
                         </Select>
                      </div>
                </div>
               <div>
                 <Label htmlFor="cproj-tags">Tags (comma-separated, optional)</Label>
                 <Input id="cproj-tags" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="e.g., final project, research, group" className="h-10 mt-1"/>
               </div>
             </CardContent>
             <CardFooter className="flex justify-end space-x-2 bg-secondary/20 p-4 border-t">
               <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
               <Button type="submit">{editingProject ? 'Save Changes' : 'Add Project'}</Button>
             </CardFooter>
           </form>
         </Card>
       )}

       {userName ? ( // Only render list if user is identified
         <>
             {/* Upcoming Projects List */}
             <div>
                 <h2 className="text-2xl font-semibold mb-4 text-primary border-b pb-2">Upcoming Projects</h2>
                 {upcomingProjects.length > 0 ? (
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {upcomingProjects.map(project => (
                             <Card key={project.id} className="flex flex-col border border-border/50 shadow-sm transition-shadow duration-200 hover:shadow-lg hover:border-primary/30">
                                 <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-4 pr-4 pl-4">
                                     <div className="flex items-center h-6 mt-1">
                                        <Checkbox
                                            id={`cproj-check-${project.id}`}
                                            checked={project.completed}
                                            onCheckedChange={() => handleToggleComplete(project.id)}
                                            aria-label={`Mark project "${project.description}" as complete`}
                                            className="peer size-5 rounded border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                        />
                                     </div>
                                     <div className="grid gap-0.5 flex-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <CardTitle className="text-lg peer-data-[state=checked]:line-through peer-data-[state=checked]:text-muted-foreground">
                                                {project.description}
                                            </CardTitle>
                                             <Badge
                                                variant={project.status === 'Graded' || project.status === 'Submitted' || project.status === 'Completed' ? 'default' : project.status === 'In Progress' ? 'secondary' : 'outline'}
                                                className={cn(
                                                     'capitalize whitespace-nowrap',
                                                     (project.status === 'Graded' || project.status === 'Submitted' || project.status === 'Completed') && 'bg-success text-success-foreground',
                                                     project.status === 'Planning' && 'border-primary text-primary',
                                                     project.status === 'In Progress' && 'bg-secondary text-secondary-foreground',
                                                 )}
                                                >
                                                 {project.status}
                                             </Badge>
                                        </div>
                                        <CardDescription className={cn("pt-1 text-xs text-muted-foreground",
                                            isPast(new Date(project.dueDate)) && !isToday(new Date(project.dueDate)) ? 'text-destructive font-semibold' :
                                            isToday(new Date(project.dueDate)) ? 'text-orange-600 dark:text-orange-400 font-semibold' : ''
                                        )}>
                                            Due: {format(new Date(project.dueDate), 'PPP')}
                                            {project.course && ` | Course: ${project.course}`}
                                            {isPast(new Date(project.dueDate)) && !isToday(new Date(project.dueDate)) && ' (Overdue)'}
                                            {isToday(new Date(project.dueDate)) && ' (Today)'}
                                        </CardDescription>
                                     </div>
                                 </CardHeader>
                                 <CardContent className="flex-grow space-y-3 pt-2 pb-4 pl-12 pr-4">
                                     {project.details && <p className="text-sm text-muted-foreground line-clamp-3">{project.details}</p>}
                                      {project.teamMembers && project.teamMembers.length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            Team: {project.teamMembers.join(', ')}
                                        </div>
                                      )}
                                     <div className="flex flex-wrap gap-1.5 pt-1">
                                       {project.tags.map(tag => <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>)}
                                     </div>
                                 </CardContent>
                                 <CardFooter className="flex justify-end gap-2 p-3 pt-0 border-t bg-secondary/20">
                                     <Button variant="ghost" size="icon" onClick={() => handleEditClick(project)} aria-label={`Edit project "${project.description}"`}>
                                         <Pencil className="h-4 w-4" />
                                     </Button>
                                     <AlertDialog>
                                       <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" aria-label={`Delete project "${project.description}"`}>
                                             <Trash2 className="h-4 w-4" />
                                          </Button>
                                       </AlertDialogTrigger>
                                       <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>Delete College Project?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                  This will permanently delete "{project.description}". This action cannot be undone.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteProject(project.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
                         <p className="text-muted-foreground italic">No upcoming college projects added yet.</p>
                     </div>
                 )}
             </div>

             {/* Completed Projects List */}
             {completedProjects.length > 0 && (
                 <div className="mt-12">
                     <h2 className="text-2xl font-semibold mb-4 text-success border-b pb-2">Completed Projects</h2>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                         {completedProjects.map(project => (
                              <Card key={project.id} className="flex flex-col border border-border/40 bg-card/80 shadow-sm opacity-80 hover:opacity-100 transition-opacity duration-200">
                                 <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-4 pr-4 pl-4">
                                      <div className="flex items-center h-6 mt-1">
                                        <Checkbox
                                            id={`cproj-check-${project.id}`}
                                            checked={project.completed}
                                            onCheckedChange={() => handleToggleComplete(project.id)}
                                            aria-label={`Mark project "${project.description}" as incomplete`}
                                            className="peer size-5 rounded border-success data-[state=checked]:bg-success data-[state=checked]:text-primary-foreground data-[state=checked]:border-success"
                                        />
                                      </div>
                                     <div className="grid gap-0.5 flex-1">
                                          <CardTitle className="text-lg line-through text-muted-foreground">
                                              {project.description}
                                          </CardTitle>
                                          <CardDescription className="text-xs text-muted-foreground">
                                              Completed (Due: {format(new Date(project.dueDate), 'PPP')})
                                              {project.course && ` | Course: ${project.course}`}
                                          </CardDescription>
                                     </div>
                                     <Badge
                                          variant='default'
                                          className={cn(
                                               'capitalize whitespace-nowrap bg-success text-success-foreground'
                                           )}
                                          >
                                           {project.status}
                                       </Badge>
                                 </CardHeader>
                                 <CardContent className="flex-grow space-y-3 pt-2 pb-4 pl-12 pr-4">
                                     {project.details && <p className="text-sm text-muted-foreground line-clamp-2 italic">{project.details}</p>}
                                      {project.teamMembers && project.teamMembers.length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            Team: {project.teamMembers.join(', ')}
                                        </div>
                                      )}
                                     <div className="flex flex-wrap gap-1.5 pt-1">
                                       {project.tags.map(tag => <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>)}
                                     </div>
                                 </CardContent>
                                 <CardFooter className="flex justify-end gap-2 p-3 pt-0 border-t bg-secondary/10">
                                     <AlertDialog>
                                       <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" aria-label={`Delete completed project "${project.description}"`}>
                                             <Trash2 className="h-4 w-4" />
                                          </Button>
                                       </AlertDialogTrigger>
                                       <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>Delete Completed Project?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                  This will permanently delete "{project.description}". This action cannot be undone.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteProject(project.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
               Loading college projects...
           </div>
       )}
    </div>
  );
}
