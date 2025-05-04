"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Assuming Textarea component exists
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
import type { Project } from '@/types'; // Use specific Project type
import { cn } from '@/lib/utils'; // Import cn utility

export default function ProjectsPage() {
  const [userName, setUserName] = useState<string | null>(null);
  // Determine storage key based on userName, default if null
  const storageKey = userName ? `${userName}-projects` : 'projects-fallback';
  const [projects, setProjects] = useLocalStorage<Project[]>(storageKey, []);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  // Form state
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<Project['status']>('Planning');


  useEffect(() => {
    setMounted(true);
    const storedName = localStorage.getItem('loggedInUserName');
    setUserName(storedName);
    // Note: The useLocalStorage hook handles initial loading from storage internally
    // based on the key, which depends on userName.
  }, []); // Run only on mount

   // Effect to update form when editingProject changes
  useEffect(() => {
    if (editingProject) {
      setDescription(editingProject.description);
      setDetails(editingProject.details || '');
      // Ensure dueDate is valid before splitting
      setDueDate(editingProject.dueDate ? editingProject.dueDate.split('T')[0] : new Date().toISOString().split('T')[0]);
      setTagsInput((editingProject.tags || []).join(', ')); // Ensure tags is an array
      setStatus(editingProject.status || 'Planning');
      setIsFormOpen(true); // Open form when editing
    } else {
      // Don't reset form here if form is intended to stay open while switching edits
      // resetForm(); // Reset only if not editing anymore
    }
  }, [editingProject]);

   const resetForm = () => {
     setDescription('');
     setDetails('');
     setDueDate(new Date().toISOString().split('T')[0]);
     setTagsInput('');
     setStatus('Planning');
     setEditingProject(null); // Clear editing state
     // Keep form open state as is unless specifically closing
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
        resetForm();
        setIsFormOpen(false);
   };

    // Sort projects (e.g., by due date) - useMemo is slightly better for performance
    const sortedProjects = useMemo(() => {
        return [...projects].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [projects]);


  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Personal Projects</h1>
          <p className="text-lg text-muted-foreground">Manage your personal projects.</p>
        </div>
         {/* Only show Add button if user context is loaded */}
         {mounted && userName && (
            <Button onClick={() => { setEditingProject(null); resetForm(); setIsFormOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Add Project
            </Button>
         )}
      </header>

      {/* Only render form and list when mounted and user is identified */}
      {mounted && userName ? (
        <>
          {/* Form Dialog/Modal or Inline Form */}
          {isFormOpen && (
            <Card>
              <CardHeader>
                <CardTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</CardTitle>
              </CardHeader>
              <form onSubmit={handleFormSubmit}>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="proj-description">Description</Label>
                    <Input id="proj-description" value={description} onChange={e => setDescription(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="proj-details">Details</Label>
                    <Textarea id="proj-details" value={details} onChange={e => setDetails(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="proj-dueDate">Due Date</Label>
                      <Input id="proj-dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="proj-status">Status</Label>
                      <select
                        id="proj-status"
                        value={status}
                        onChange={e => setStatus(e.target.value as Project['status'])}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" // Basic styling, adapt using Select component if preferred
                      >
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="proj-tags">Tags (comma-separated)</Label>
                    <Input id="proj-tags" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="e.g., web, mobile, learning" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                  <Button type="submit">{editingProject ? 'Save Changes' : 'Add Project'}</Button>
                </CardFooter>
              </form>
            </Card>
          )}


          {/* Project List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedProjects.length > 0 ? sortedProjects.map(project => (
                   <Card key={project.id} className="flex flex-col">
                       <CardHeader>
                           <div className="flex justify-between items-start gap-2">
                               <CardTitle className="text-lg">{project.description}</CardTitle>
                                <Badge
                                  variant={project.status === 'Completed' ? 'default' : project.status === 'In Progress' ? 'secondary' : 'outline'}
                                  className={cn(
                                       project.status === 'Completed' && 'bg-success text-success-foreground',
                                       project.status === 'On Hold' && 'bg-destructive text-destructive-foreground'
                                   )}
                                  >
                                   {project.status || 'Planning'}
                               </Badge>
                           </div>
                           <CardDescription>Due: {new Date(project.dueDate).toLocaleDateString()}</CardDescription>
                       </CardHeader>
                       <CardContent className="flex-grow space-y-2">
                           {project.details && <p className="text-sm text-muted-foreground line-clamp-3">{project.details}</p>}
                           <div className="flex flex-wrap gap-1">
                             {(project.tags || []).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                           </div>
                       </CardContent>
                       <CardFooter className="flex justify-end gap-2">
                           <Button variant="ghost" size="icon" onClick={() => handleEditClick(project)}>
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
                                    <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete "{project.description}".
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
                   <p className="text-muted-foreground italic md:col-span-2 lg:col-span-3 text-center">No projects yet. Add one to get started!</p>
               )}
           </div>
         </>
      ) : (
          // Optional: Show a loading state or skeleton while waiting for mount/userName
          <div className="text-center text-muted-foreground">Loading projects...</div>
      )}
    </div>
  );
}
