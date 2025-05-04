"use client";

// This page is very similar to Personal Projects.
// Consider abstracting the Project management logic into a reusable component or hook
// if the requirements become more complex or diverge significantly.

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import type { Task } from '@/types'; // Reuse Task type

// Extend or modify Task type if needed for College Projects
interface CollegeProject extends Task {
  course?: string; // Example: Associated course
  teamMembers?: string[]; // Example: Collaborators
  details?: string;
  status?: 'Planning' | 'In Progress' | 'Completed' | 'Submitted' | 'Graded';
}

export default function CollegeProjectsPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const storageKey = userName ? `${userName}-college-projects` : 'college-projects';
  const [projects, setProjects] = useLocalStorage<CollegeProject[]>(storageKey, []);
  const [editingProject, setEditingProject] = useState<CollegeProject | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
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
    setMounted(true);
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
      resetForm();
    }
  }, [editingProject]);

   const resetForm = () => {
     setDescription('');
     setDetails('');
     setCourse('');
     setTeamMembersInput('');
     setDueDate(new Date().toISOString().split('T')[0]);
     setTagsInput('');
     setStatus('Planning');
     setEditingProject(null);
   };

   const handleFormSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!description.trim()) {
         toast({ title: "Error", description: "Project description is required.", variant: "destructive" });
         return;
     };

     const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
     const teamMembers = teamMembersInput.split(',').map(mem => mem.trim()).filter(mem => mem !== '');

     const projectData: Omit<CollegeProject, 'id' | 'completed'> = {
        description: description.trim(),
        details: details.trim(),
        course: course.trim(),
        teamMembers,
        dueDate: new Date(dueDate).toISOString(),
        tags,
        status,
     };

     if (editingProject) {
       const updatedProject: CollegeProject = {
         ...projectData,
         id: editingProject.id,
         completed: ['Completed', 'Submitted', 'Graded'].includes(status || ''),
       };
       setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
       toast({ title: "College Project Updated", description: `"${updatedProject.description}" updated.` });
     } else {
       const newProject: CollegeProject = {
         ...projectData,
         id: crypto.randomUUID(),
         completed: ['Completed', 'Submitted', 'Graded'].includes(status || ''),
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
   };

   const handleCancelEdit = () => {
        resetForm();
        setIsFormOpen(false);
   };

    const sortedProjects = [...projects].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">College Projects</h1>
          <p className="text-lg text-muted-foreground">Track your academic projects.</p>
        </div>
        <Button onClick={() => { setEditingProject(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add College Project
        </Button>
      </header>

       {isFormOpen && (
         <Card>
           <CardHeader>
             <CardTitle>{editingProject ? 'Edit College Project' : 'Add New College Project'}</CardTitle>
           </CardHeader>
           <form onSubmit={handleFormSubmit}>
             <CardContent className="space-y-4">
               <div>
                 <Label htmlFor="cproj-description">Description</Label>
                 <Input id="cproj-description" value={description} onChange={e => setDescription(e.target.value)} required />
               </div>
                <div>
                 <Label htmlFor="cproj-course">Course (Optional)</Label>
                 <Input id="cproj-course" value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g., CS 465" />
               </div>
               <div>
                 <Label htmlFor="cproj-details">Details (Optional)</Label>
                 <Textarea id="cproj-details" value={details} onChange={e => setDetails(e.target.value)} />
               </div>
                <div>
                 <Label htmlFor="cproj-team">Team Members (comma-separated, optional)</Label>
                 <Input id="cproj-team" value={teamMembersInput} onChange={e => setTeamMembersInput(e.target.value)} placeholder="e.g., Jane Doe, John Smith" />
               </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="cproj-dueDate">Due Date</Label>
                         <Input id="cproj-dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                     </div>
                     <div>
                         <Label htmlFor="cproj-status">Status</Label>
                         <select
                             id="cproj-status"
                             value={status}
                             onChange={e => setStatus(e.target.value as CollegeProject['status'])}
                             className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                         >
                             <option value="Planning">Planning</option>
                             <option value="In Progress">In Progress</option>
                             <option value="Completed">Completed</option>
                             <option value="Submitted">Submitted</option>
                             <option value="Graded">Graded</option>
                         </select>
                      </div>
                </div>
               <div>
                 <Label htmlFor="cproj-tags">Tags (comma-separated, optional)</Label>
                 <Input id="cproj-tags" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="e.g., final project, research, group" />
               </div>
             </CardContent>
             <CardFooter className="flex justify-end space-x-2">
               <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
               <Button type="submit">{editingProject ? 'Save Changes' : 'Add Project'}</Button>
             </CardFooter>
           </form>
         </Card>
       )}

       {mounted && userName && (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedProjects.length > 0 ? sortedProjects.map(project => (
                 <Card key={project.id} className="flex flex-col">
                     <CardHeader>
                         <div className="flex justify-between items-start gap-2">
                             <CardTitle>{project.description}</CardTitle>
                              <Badge
                                variant={project.status === 'Graded' || project.status === 'Submitted' || project.status === 'Completed' ? 'default' : project.status === 'In Progress' ? 'secondary' : 'outline'}
                                className={cn(
                                     (project.status === 'Graded' || project.status === 'Submitted' || project.status === 'Completed') && 'bg-success text-success-foreground',
                                     // Add more status colors if needed
                                 )}
                                >
                                 {project.status}
                             </Badge>
                         </div>
                         <CardDescription>
                            Due: {new Date(project.dueDate).toLocaleDateString()}
                            {project.course && ` | Course: ${project.course}`}
                         </CardDescription>
                     </CardHeader>
                     <CardContent className="flex-grow space-y-2">
                         {project.details && <p className="text-sm text-muted-foreground line-clamp-3">{project.details}</p>}
                          {project.teamMembers && project.teamMembers.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                                Team: {project.teamMembers.join(', ')}
                            </div>
                          )}
                         <div className="flex flex-wrap gap-1 pt-2">
                           {project.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
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
                                  <AlertDialogTitle>Delete College Project?</AlertDialogTitle>
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
                 <p className="text-muted-foreground italic md:col-span-2 lg:col-span-3 text-center">No college projects added yet.</p>
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
