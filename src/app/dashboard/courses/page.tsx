"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Link as LinkIcon, BookOpen, Star } from 'lucide-react';
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

interface Course {
  id: string;
  title: string;
  platform: string; // e.g., Coursera, Udemy, University
  status: 'Not Started' | 'In Progress' | 'Completed';
  completionDate?: string; // ISO String
  link?: string; // Link to course page
  certificateUrl?: string; // Link to certificate if separate
  rating?: number; // 1-5 star rating
  notes?: string;
}

export default function CoursesPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const storageKey = userName ? `${userName}-courses` : 'courses';
  const [courses, setCourses] = useLocalStorage<Course[]>(storageKey, []);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
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
    setMounted(true);
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
      resetForm();
    }
  }, [editingCourse]);

   const resetForm = () => {
     setTitle('');
     setPlatform('');
     setStatus('Not Started');
     setCompletionDate('');
     setLink('');
     setCertificateUrl('');
     setRating(undefined);
     setNotes('');
     setEditingCourse(null);
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


     const courseData: Omit<Course, 'id'> = {
        title: title.trim(),
        platform: platform.trim(),
        status,
        completionDate: completionDate && status === 'Completed' ? new Date(completionDate).toISOString() : undefined,
        link: validLink || undefined,
        certificateUrl: validCertUrl || undefined,
        rating: rating,
        notes: notes.trim() || undefined,
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

   // Sort courses (e.g., by status then title)
   const sortedCourses = [...courses].sort((a, b) => {
      const statusOrder = { 'In Progress': 1, 'Not Started': 2, 'Completed': 3 };
      const statusCompare = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      if (statusCompare !== 0) return statusCompare;
      return a.title.localeCompare(b.title);
   });


  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Courses</h1>
          <p className="text-lg text-muted-foreground">Track your online and university courses.</p>
        </div>
        <Button onClick={() => { setEditingCourse(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Course
        </Button>
      </header>

       {isFormOpen && (
         <Card>
           <CardHeader>
             <CardTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</CardTitle>
           </CardHeader>
           <form onSubmit={handleFormSubmit}>
             <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="course-title">Course Title</Label>
                         <Input id="course-title" value={title} onChange={e => setTitle(e.target.value)} required />
                     </div>
                     <div>
                         <Label htmlFor="course-platform">Platform/Institution</Label>
                         <Input id="course-platform" value={platform} onChange={e => setPlatform(e.target.value)} required placeholder="e.g., Coursera, University Name" />
                     </div>
                 </div>
                <div>
                    <Label htmlFor="course-status">Status</Label>
                     <select
                         id="course-status"
                         value={status}
                         onChange={e => setStatus(e.target.value as Course['status'])}
                         className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                     >
                         <option value="Not Started">Not Started</option>
                         <option value="In Progress">In Progress</option>
                         <option value="Completed">Completed</option>
                     </select>
                 </div>
                 {status === 'Completed' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <Label htmlFor="course-compDate">Completion Date</Label>
                             <Input id="course-compDate" type="date" value={completionDate} onChange={e => setCompletionDate(e.target.value)} required={status === 'Completed'} />
                        </div>
                         <div>
                             <Label htmlFor="course-rating">Your Rating (1-5, Optional)</Label>
                             <Input id="course-rating" type="number" min="1" max="5" value={rating ?? ''} onChange={e => handleRatingChange(e.target.value)} />
                         </div>
                    </div>
                 )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="course-link">Course Link (Optional)</Label>
                         <Input id="course-link" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
                     </div>
                      <div>
                         <Label htmlFor="course-certUrl">Certificate Link (Optional)</Label>
                         <Input id="course-certUrl" type="url" value={certificateUrl} onChange={e => setCertificateUrl(e.target.value)} placeholder="https://verify..." />
                     </div>
                 </div>
                 <div>
                     <Label htmlFor="course-notes">Notes (Optional)</Label>
                     <Textarea id="course-notes" value={notes} onChange={e => setNotes(e.target.value)} />
                 </div>
             </CardContent>
             <CardFooter className="flex justify-end space-x-2">
               <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
               <Button type="submit">{editingCourse ? 'Save Changes' : 'Add Course'}</Button>
             </CardFooter>
           </form>
         </Card>
       )}

       {mounted && userName && (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedCourses.length > 0 ? sortedCourses.map(course => (
                 <Card key={course.id} className="flex flex-col">
                     <CardHeader>
                          <div className="flex justify-between items-start gap-2">
                             <div>
                                 <CardTitle>{course.title}</CardTitle>
                                 <CardDescription>{course.platform}</CardDescription>
                             </div>
                              <Badge
                                variant={course.status === 'Completed' ? 'default' : course.status === 'In Progress' ? 'secondary' : 'outline'}
                                className={cn(course.status === 'Completed' && 'bg-success text-success-foreground')}
                                >
                                 {course.status}
                             </Badge>
                         </div>
                         {course.completionDate && (
                            <p className="text-xs text-muted-foreground pt-1">Completed: {new Date(course.completionDate).toLocaleDateString()}</p>
                         )}
                         {course.rating && (
                             <div className="flex items-center pt-1">
                                 {[...Array(5)].map((_, i) => (
                                     <Star key={i} className={`h-4 w-4 ${i < (course.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                                 ))}
                             </div>
                         )}
                     </CardHeader>
                     <CardContent className="flex-grow space-y-2">
                         {course.notes && <p className="text-sm text-muted-foreground line-clamp-3">{course.notes}</p>}
                         <div className="flex flex-col space-y-1">
                             {course.link && (
                                 <Link href={course.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                     <BookOpen className="h-3 w-3" /> Course Page
                                 </Link>
                             )}
                             {course.certificateUrl && (
                                 <Link href={course.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                     <LinkIcon className="h-3 w-3" /> View Certificate
                                 </Link>
                             )}
                         </div>
                     </CardContent>
                     <CardFooter className="flex justify-end gap-2">
                         <Button variant="ghost" size="icon" onClick={() => handleEditClick(course)}>
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
                                  <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will permanently delete the course "{course.title}".
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
             )) : (
                 <p className="text-muted-foreground italic md:col-span-2 lg:col-span-3 text-center">No courses added yet.</p>
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
