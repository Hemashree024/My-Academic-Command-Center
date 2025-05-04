
"use client";

import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Link as LinkIcon, BookOpen, Star, Info } from 'lucide-react'; // Added Info
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
import type { Course } from '@/types'; // Import specific type
import { cn } from '@/lib/utils'; // Import cn
import { format } from 'date-fns'; // Import date-fns

export default function CoursesPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const storageKey = userName ? `${userName}-courses` : 'courses-fallback'; // Fallback key
  const [courses, setCourses] = useLocalStorage<Course[]>(storageKey, []);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isClient, setIsClient] = useState(false); // State to track client mount
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('');
  const [status, setStatus] = useState<Course['status']>('Not Started');
  const [completionDate, setCompletionDate] = useState<string>('');
  const [link, setLink] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setIsClient(true); // Component has mounted
    const storedName = localStorage.getItem('loggedInUserName');
    setUserName(storedName);
  }, []);

  useEffect(() => {
    if (editingCourse) {
      setTitle(editingCourse.title);
      setPlatform(editingCourse.platform);
      setStatus(editingCourse.status);
      setCompletionDate(editingCourse.completionDate ? editingCourse.completionDate.split('T')[0] : '');
      setLink(editingCourse.link || '');
      setCertificateUrl(editingCourse.certificateUrl || '');
      setRating(editingCourse.rating);
      setNotes(editingCourse.notes || '');
      setIsFormOpen(true);
    } else {
      // Only reset if not currently editing
      if (!isFormOpen) resetForm();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingCourse, isFormOpen]);

   const resetForm = () => {
     setTitle('');
     setPlatform('');
     setStatus('Not Started');
     setCompletionDate('');
     setLink('');
     setCertificateUrl('');
     setRating(undefined);
     setNotes('');
     setEditingCourse(null); // Explicitly clear editing state
   };

   const handleFormSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!title.trim() || !platform.trim()) {
        toast({ title: "Error", description: "Course Title and Platform are required.", variant: "destructive" });
        return;
     };

     let validLink = link.trim();
     if (validLink && !validLink.startsWith('http://') && !validLink.startsWith('https://')) {
        validLink = 'https://' + validLink;
     }
      let validCertUrl = certificateUrl.trim();
     if (validCertUrl && !validCertUrl.startsWith('http://') && !validCertUrl.startsWith('https://')) {
        validCertUrl = 'https://' + validCertUrl;
     }

     const isCompleted = status === 'Completed';

     const courseData: Omit<Course, 'id'> = {
        title: title.trim(),
        platform: platform.trim(),
        status,
        completionDate: completionDate && isCompleted ? new Date(completionDate).toISOString() : undefined,
        link: validLink || undefined,
        certificateUrl: validCertUrl || undefined,
        rating: rating,
        notes: notes.trim() || undefined,
        completed: isCompleted, // Sync completed status
     };

     if (editingCourse) {
       const updatedCourse: Course = { ...courseData, id: editingCourse.id };
       setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
       toast({ title: "Course Updated", description: `"${updatedCourse.title}" updated.` });
     } else {
       const newCourse: Course = { ...courseData, id: crypto.randomUUID() };
       setCourses(prev => [...prev, newCourse]);
       toast({ title: "Course Added", description: `"${newCourse.title}" added.` });
     }

     resetForm();
     setIsFormOpen(false);
   };

   const handleDeleteCourse = (id: string) => {
     const courseToDelete = courses.find(c => c.id === id);
     setCourses(prev => prev.filter(c => c.id !== id));
      if (courseToDelete) {
         toast({ title: "Course Deleted", description: `"${courseToDelete.title}" deleted.`, variant: "destructive" });
      }
   };

   const handleEditClick = (course: Course) => {
       setEditingCourse(course);
       // Form opens via useEffect
   };

   const handleCancelEdit = () => {
        resetForm();
        setIsFormOpen(false);
   };

    const handleRatingChange = (value: string) => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 1 && num <= 5) {
            setRating(num);
        } else if (value === '') {
             setRating(undefined);
        }
    }

    // Toggle course completion status
   const handleToggleComplete = (id: string) => {
     const courseToUpdate = courses.find(c => c.id === id);
     if (!courseToUpdate) return;

     const wasCompleted = courseToUpdate.completed;
     const newStatus = wasCompleted ? 'In Progress' : 'Completed'; // Toggle between In Progress and Completed
     const newCompletionDate = !wasCompleted ? new Date().toISOString() : undefined; // Set completion date if completing

     setCourses(prevCourses =>
       prevCourses.map(c =>
         c.id === id ? { ...c, completed: !wasCompleted, status: newStatus, completionDate: newCompletionDate } : c
       )
     );

     toast({
       title: `Course ${wasCompleted ? 'Marked In Progress' : 'Marked Complete'}`,
       description: `"${courseToUpdate.title}" status set to ${newStatus}.`,
       variant: wasCompleted ? 'default' : 'success',
     });
   };

   // Sort courses: In Progress/Not Started first, then Completed. Within groups, alphabetically.
   const sortedCourses = useMemo(() => {
       return [...courses].sort((a, b) => {
         if (a.completed !== b.completed) {
            return a.completed ? 1 : -1; // In Progress/Not Started first
         }
         // Then sort by status order within incomplete group
         if (!a.completed) {
             const statusOrder = { 'In Progress': 1, 'Not Started': 2 };
             const statusCompare = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
             if (statusCompare !== 0) return statusCompare;
         }
         // Finally, sort alphabetically
         return a.title.localeCompare(b.title);
       });
   }, [courses]);

    // Separate into active and completed *after* sorting
   const activeCourses = sortedCourses.filter(c => !c.completed);
   const completedCourses = sortedCourses.filter(c => c.completed);


   // Render skeleton or null during SSR and initial client render before mount
   if (!isClient) {
     return (
       <div className="space-y-8">
         <header className="flex justify-between items-center">
           <div>
             <Skeleton className="h-9 w-36 mb-2" />
             <Skeleton className="h-6 w-72" />
           </div>
           <Skeleton className="h-10 w-36 rounded-md" />
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
          <h1 className="text-3xl font-bold text-primary mb-2">Courses</h1>
          <p className="text-lg text-muted-foreground">Track your online and university courses.</p>
        </div>
        {userName && ( // Only show button if user is identified
           <Button onClick={() => { setEditingCourse(null); resetForm(); setIsFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Course
           </Button>
        )}
      </header>

       {isFormOpen && (
         <Card className="border border-border/50 shadow-sm">
           <CardHeader>
             <CardTitle className="text-xl text-primary">{editingCourse ? 'Edit Course' : 'Add New Course'}</CardTitle>
           </CardHeader>
           <form onSubmit={handleFormSubmit}>
             <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="course-title">Course Title</Label>
                         <Input id="course-title" value={title} onChange={e => setTitle(e.target.value)} required className="h-10 mt-1"/>
                     </div>
                     <div>
                         <Label htmlFor="course-platform">Platform/Institution</Label>
                         <Input id="course-platform" value={platform} onChange={e => setPlatform(e.target.value)} required placeholder="e.g., Coursera, University Name" className="h-10 mt-1"/>
                     </div>
                 </div>
                <div>
                    <Label htmlFor="course-status">Status</Label>
                     <Select value={status} onValueChange={(value) => setStatus(value as Course['status'])}>
                         <SelectTrigger className="w-full h-10 mt-1">
                             <SelectValue placeholder="Select status" />
                         </SelectTrigger>
                         <SelectContent>
                             <SelectItem value="Not Started">Not Started</SelectItem>
                             <SelectItem value="In Progress">In Progress</SelectItem>
                             <SelectItem value="Completed">Completed</SelectItem>
                         </SelectContent>
                     </Select>
                 </div>
                 {status === 'Completed' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <Label htmlFor="course-compDate">Completion Date</Label>
                             <Input id="course-compDate" type="date" value={completionDate} onChange={e => setCompletionDate(e.target.value)} required={status === 'Completed'} className="h-10 mt-1"/>
                        </div>
                         <div>
                             <Label htmlFor="course-rating">Your Rating (1-5, Optional)</Label>
                             <Input id="course-rating" type="number" min="1" max="5" value={rating ?? ''} onChange={e => handleRatingChange(e.target.value)} className="h-10 mt-1"/>
                         </div>
                    </div>
                 )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="course-link">Course Link (Optional)</Label>
                         <Input id="course-link" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="h-10 mt-1"/>
                     </div>
                      <div>
                         <Label htmlFor="course-certUrl">Certificate Link (Optional)</Label>
                         <Input id="course-certUrl" type="url" value={certificateUrl} onChange={e => setCertificateUrl(e.target.value)} placeholder="https://verify..." className="h-10 mt-1"/>
                     </div>
                 </div>
                 <div>
                     <Label htmlFor="course-notes">Notes (Optional)</Label>
                     <Textarea id="course-notes" value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 min-h-[60px]"/>
                 </div>
             </CardContent>
             <CardFooter className="flex justify-end space-x-2 bg-secondary/20 p-4 border-t">
               <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
               <Button type="submit">{editingCourse ? 'Save Changes' : 'Add Course'}</Button>
             </CardFooter>
           </form>
         </Card>
       )}

       {userName ? ( // Only render list if user is identified
         <>
             {/* Active Courses */}
             <div>
                 <h2 className="text-2xl font-semibold mb-4 text-primary border-b pb-2">Active Courses</h2>
                 {activeCourses.length > 0 ? (
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {activeCourses.map(course => (
                             <Card key={course.id} className="flex flex-col border border-border/50 shadow-sm transition-shadow duration-200 hover:shadow-lg hover:border-primary/30">
                                 <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-4 pr-4 pl-4">
                                      <div className="flex items-center h-6 mt-1">
                                        <Checkbox
                                          id={`course-check-${course.id}`}
                                          checked={course.completed}
                                          onCheckedChange={() => handleToggleComplete(course.id)}
                                          aria-label={`Mark course "${course.title}" as complete`}
                                          className="peer size-5 rounded border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                        />
                                      </div>
                                     <div className="grid gap-0.5 flex-1">
                                         <div className="flex justify-between items-start gap-2">
                                             <div>
                                                 <CardTitle className="text-lg peer-data-[state=checked]:line-through peer-data-[state=checked]:text-muted-foreground">
                                                     {course.title}
                                                 </CardTitle>
                                                 <CardDescription className="peer-data-[state=checked]:line-through peer-data-[state=checked]:text-muted-foreground">
                                                     {course.platform}
                                                 </CardDescription>
                                             </div>
                                              <Badge
                                                variant={course.status === 'Completed' ? 'default' : course.status === 'In Progress' ? 'secondary' : 'outline'}
                                                className={cn(
                                                    'capitalize whitespace-nowrap',
                                                    course.status === 'Completed' && 'bg-success text-success-foreground',
                                                    course.status === 'In Progress' && 'bg-secondary text-secondary-foreground',
                                                    course.status === 'Not Started' && 'border-primary text-primary'
                                                )}
                                                >
                                                 {course.status}
                                             </Badge>
                                         </div>
                                          <div className="pt-2 space-y-1"> {/* Group details */}
                                             {course.rating && ( // Show rating only if completed, move later
                                                 <div className="flex items-center">
                                                     {[...Array(5)].map((_, i) => (
                                                         <Star key={i} className={`h-4 w-4 ${i < (course.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`} />
                                                     ))}
                                                 </div>
                                             )}
                                          </div>
                                     </div>
                                 </CardHeader>
                                 <CardContent className="flex-grow space-y-3 pt-2 pb-4 pl-12 pr-4">
                                     {course.notes && <p className="text-sm text-muted-foreground line-clamp-3">{course.notes}</p>}
                                     <div className="flex flex-col space-y-1.5 pt-1"> {/* Link section */}
                                         {course.link && (
                                             <Link href={course.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1.5">
                                                 <BookOpen className="h-3.5 w-3.5" /> Course Page
                                             </Link>
                                         )}
                                         {course.certificateUrl && (
                                             <Link href={course.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1.5">
                                                 <LinkIcon className="h-3.5 w-3.5" /> View Certificate
                                             </Link>
                                         )}
                                     </div>
                                 </CardContent>
                                 <CardFooter className="flex justify-end gap-2 p-3 pt-0 border-t bg-secondary/20">
                                     <Button variant="ghost" size="icon" onClick={() => handleEditClick(course)} aria-label={`Edit course "${course.title}"`}>
                                         <Pencil className="h-4 w-4" />
                                     </Button>
                                     <AlertDialog>
                                       <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" aria-label={`Delete course "${course.title}"`}>
                                             <Trash2 className="h-4 w-4" />
                                          </Button>
                                       </AlertDialogTrigger>
                                       <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                  This will permanently delete the course "{course.title}". This action cannot be undone.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteCourse(course.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
                         <p className="text-muted-foreground italic">No active courses added yet.</p>
                     </div>
                 )}
             </div>

             {/* Completed Courses */}
              {completedCourses.length > 0 && (
                 <div className="mt-12">
                     <h2 className="text-2xl font-semibold mb-4 text-success border-b pb-2">Completed Courses</h2>
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                         {completedCourses.map(course => (
                             <Card key={course.id} className="flex flex-col border border-border/40 bg-card/80 shadow-sm opacity-80 hover:opacity-100 transition-opacity duration-200">
                                 <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-4 pr-4 pl-4">
                                      <div className="flex items-center h-6 mt-1">
                                        <Checkbox
                                          id={`course-check-${course.id}`}
                                          checked={course.completed}
                                          onCheckedChange={() => handleToggleComplete(course.id)}
                                          aria-label={`Mark course "${course.title}" as incomplete`}
                                          className="peer size-5 rounded border-success data-[state=checked]:bg-success data-[state=checked]:text-primary-foreground data-[state=checked]:border-success"
                                        />
                                      </div>
                                     <div className="grid gap-0.5 flex-1">
                                         <div className="flex justify-between items-start gap-2">
                                            <div>
                                                 <CardTitle className="text-lg line-through text-muted-foreground">{course.title}</CardTitle>
                                                 <CardDescription className="line-through text-muted-foreground">{course.platform}</CardDescription>
                                             </div>
                                              <Badge
                                                variant='default'
                                                className={cn(
                                                    'capitalize whitespace-nowrap bg-success text-success-foreground'
                                                )}
                                                >
                                                 {course.status}
                                             </Badge>
                                         </div>
                                          <div className="pt-2 space-y-1">
                                             {course.completionDate && (
                                                <p className="text-xs text-muted-foreground">Completed: {format(new Date(course.completionDate), 'PPP')}</p>
                                             )}
                                             {course.rating && (
                                                 <div className="flex items-center">
                                                     {[...Array(5)].map((_, i) => (
                                                         <Star key={i} className={`h-4 w-4 ${i < (course.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`} />
                                                     ))}
                                                 </div>
                                             )}
                                          </div>
                                     </div>
                                 </CardHeader>
                                 <CardContent className="flex-grow space-y-3 pt-2 pb-4 pl-12 pr-4">
                                     {course.notes && <p className="text-sm text-muted-foreground line-clamp-2 italic">{course.notes}</p>}
                                     <div className="flex flex-col space-y-1.5 pt-1">
                                         {course.link && (
                                             <Link href={course.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary/80 hover:underline flex items-center gap-1.5">
                                                 <BookOpen className="h-3.5 w-3.5" /> Course Page
                                             </Link>
                                         )}
                                         {course.certificateUrl && (
                                             <Link href={course.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary/80 hover:underline flex items-center gap-1.5">
                                                 <LinkIcon className="h-3.5 w-3.5" /> View Certificate
                                             </Link>
                                         )}
                                     </div>
                                 </CardContent>
                                 <CardFooter className="flex justify-end gap-2 p-3 pt-0 border-t bg-secondary/10">
                                      <AlertDialog>
                                       <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" aria-label={`Delete completed course "${course.title}"`}>
                                             <Trash2 className="h-4 w-4" />
                                          </Button>
                                       </AlertDialogTrigger>
                                       <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>Delete Completed Course?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                  This will permanently delete the course "{course.title}". This action cannot be undone.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteCourse(course.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
               Loading courses...
           </div>
       )}
    </div>
  );
}
