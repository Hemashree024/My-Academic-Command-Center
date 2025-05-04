
"use client";

import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Info } from 'lucide-react'; // Added Info
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import type { Project } from '@/types'; // Use specific Project type
import { cn } from '@/lib/utils'; // Import cn utility

export default function ProjectsPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const storageKey = userName ? `${userName}-projects` : 'projects-fallback'; // Fallback key
  const [projects, setProjects] = useLocalStorage<Project[]>(storageKey, []);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isClient, setIsClient] = useState(false); // State to track client mount
  const { toast } = useToast();

  // Form state
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<Project['status']>('Planning');


  useEffect(() => {
    setIsClient(true); // Component has mounted
    const storedName = localStorage.getItem('loggedInUserName');
    setUserName(storedName);
    // Note: The useLocalStorage hook handles initial loading from storage internally
    // based on the key, which depends on userName.
  }, []); // Run only on mount

   // Effect to update form when editingProject changes or form opens/closes
  useEffect(() => {
    if (editingProject) {
      setDescription(editingProject.description);
      setDetails(editingProject.details || '');
      setDueDate(editingProject.dueDate ? editingProject.dueDate.split('T')[0] : new Date().toISOString().split('T')[0]);
      setTagsInput((editingProject.tags || []).join(', '));
      setStatus(editingProject.status || 'Planning');
      setIsFormOpen(true); // Ensure form is open when editing
    } else {
      // Only reset if the form is not open (prevents resetting when just closing the form)
      if (!isFormOpen) resetForm();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProject, isFormOpen]); // Re-run if editingProject or isFormOpen changes

   const resetForm = () => {
     setDescription('');
     setDetails('');
     setDueDate(new Date().toISOString().split('T')[0]);
     setTagsInput('');
     setStatus('Planning');
     setEditingProject(null); // Clear editing state explicitly
     // Do not change isFormOpen here, let the buttons handle it
   };

   const handleFormSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!description.trim()) {
        toast({ title: "Error", description: "Project description cannot be empty.", variant: "destructive" });
        return;
     };

     const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
     const projectData: Omit<Project, 'id' | 'completed'> = {
        description: description.trim(),
        details: details.trim() || undefined,
        dueDate: new Date(dueDate).toISOString(), // Store as ISO string
        tags,
        status,
     };

     if (editingProject) {
       // Update existing project
       const updatedProject: Project = {
         ...projectData,
         id: editingProject.id,
         completed: status === 'Completed', // Mark completed based on status
       };
       setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
       toast({ title: "Project Updated", description: `"${updatedProject.description}" updated.` });
     } else {
       // Add new project
       const newProject: Project = {
         ...projectData,
         id: crypto.randomUUID(),
         completed: status === 'Completed',
       };
       setProjects(prev => [...prev, newProject]);
       toast({ title: "Project Added", description: `"${newProject.description}" added.` });
     }

     resetForm();
     setIsFormOpen(false); // Close form after submit
   };

   const handleDeleteProject = (id: string) => {
     const projectToDelete = projects.find(p => p.id === id);
     setProjects(prev => prev.filter(p => p.id !== id));
     if (projectToDelete) {
        toast({ title: "Project Deleted", description: `"${projectToDelete.description}" deleted.`, variant: "destructive" });
     }
   };

   const handleEditClick = (project: Project) => {
       setEditingProject(project);
       // Form state is set via useEffect dependency on editingProject
   };

   const handleCancelEdit = () => {
        resetForm(); // Reset form fields and editing state
        setIsFormOpen(false); // Close the form
   };

    // Sort projects using useMemo
    const sortedProjects = useMemo(() => {
        return [...projects].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [projects]);

  // Render skeleton or null during SSR and initial client render before mount
   if (!isClient) {
     return (
       <div className="space-y-8">
         <header className="flex justify-between items-center">
           <div>
             <Skeleton className="h-9 w-52 mb-2" />
             <Skeleton className="h-6 w-64" />
           </div>
           <Skeleton className="h-10 w-36 rounded-md" />
         </header>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 rounded-lg" />)}
         </div>
       </div>
     );
   }


  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Personal Projects</h1>
          <p className="text-lg text-muted-foreground">Manage your personal projects.</p>
        </div>
         {/* Only show Add button if user context is loaded */}
         {userName && (
            <Button onClick={() => { setEditingProject(null); resetForm(); setIsFormOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Add Project
            </Button>
         )}
      </header>

      {/* Only render form and list when client has mounted and user is identified */}
      {userName ? (
        <>
          {/* Form Section */}
          {isFormOpen && (
            <Card className="border border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-primary">{editingProject ? 'Edit Project' : 'Add New Project'}</CardTitle>
              </CardHeader>
              <form onSubmit={handleFormSubmit}>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="proj-description">Description</Label>
                    <Input id="proj-description" value={description} onChange={e => setDescription(e.target.value)} required className="h-10 mt-1"/>
                  </div>
                  <div>
                    <Label htmlFor="proj-details">Details</Label>
                    <Textarea id="proj-details" value={details} onChange={e => setDetails(e.target.value)} className="mt-1 min-h-[60px]"/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="proj-dueDate">Due Date</Label>
                      <Input id="proj-dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="h-10 mt-1"/>
                    </div>
                    <div>
                      <Label htmlFor="proj-status">Status</Label>
                       <Select value={status} onValueChange={(value) => setStatus(value as Project['status'])}>
                         <SelectTrigger className="w-full h-10 mt-1">
                           <SelectValue placeholder="Select status" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="Planning">Planning</SelectItem>
                           <SelectItem value="In Progress">In Progress</SelectItem>
                           <SelectItem value="Completed">Completed</SelectItem>
                           <SelectItem value="On Hold">On Hold</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="proj-tags">Tags (comma-separated)</Label>
                    <Input id="proj-tags" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="e.g., web, mobile, learning" className="h-10 mt-1"/>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 bg-secondary/20 p-4 border-t">
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                  <Button type="submit">{editingProject ? 'Save Changes' : 'Add Project'}</Button>
                </CardFooter>
              </form>
            </Card>
          )}


          {/* Project List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedProjects.length > 0 ? sortedProjects.map(project => (
                   <Card key={project.id} className="flex flex-col border border-border/50 shadow-sm transition-shadow duration-200 hover:shadow-lg hover:border-primary/30">
                       <CardHeader className="pb-3"> {/* Reduced padding */}
                           <div className="flex justify-between items-start gap-2">
                               <CardTitle className="text-lg">{project.description}</CardTitle>
                                <Badge
                                  variant={project.status === 'Completed' ? 'default' : project.status === 'In Progress' ? 'secondary' : 'outline'}
                                  className={cn(
                                       'capitalize', // Capitalize status
                                       project.status === 'Completed' && 'bg-success text-success-foreground',
                                       project.status === 'On Hold' && 'bg-destructive text-destructive-foreground',
                                       project.status === 'In Progress' && 'bg-secondary text-secondary-foreground',
                                       project.status === 'Planning' && 'border-primary text-primary'
                                   )}
                                  >
                                   {project.status || 'Planning'}
                               </Badge>
                           </div>
                           <CardDescription className="pt-1">Due: {new Date(project.dueDate).toLocaleDateString()}</CardDescription>
                       </CardHeader>
                       <CardContent className="flex-grow space-y-3 pt-0 pb-4 pl-6 pr-4"> {/* Adjusted padding */}
                           {project.details && <p className="text-sm text-muted-foreground line-clamp-3">{project.details}</p>}
                           <div className="flex flex-wrap gap-1.5 pt-1"> {/* Added padding */}
                             {(project.tags || []).map(tag => <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>)}
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
                                    <AlertDialogTitle>Delete Project?</AlertDialogTitle>
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
               )) : (
                    <div className="col-span-full text-center py-10 px-4 border border-dashed rounded-lg">
                       <Info className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                       <p className="text-muted-foreground italic">No projects yet. Click "Add Project" to get started!</p>
                   </div>
               )}
           </div>
         </>
      ) : (
          // Optional: Show a loading state or message while waiting for mount/userName
          <div className="text-center text-muted-foreground italic py-10">Loading projects...</div>
      )}
    </div>
  );
}
