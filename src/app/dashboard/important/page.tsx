
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Info, AlertTriangle } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import type { ImportantItem } from '@/types';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns'; // Import date-fns

export default function ImportantPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const storageKey = userName ? `${userName}-important` : 'important-fallback';
  const [items, setItems] = useLocalStorage<ImportantItem[]>(storageKey, []);
  const [editingItem, setEditingItem] = useState<ImportantItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [tagsInput, setTagsInput] = useState('');
  const [priority, setPriority] = useState<ImportantItem['priority']>('Medium');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [completedForm, setCompletedForm] = useState(false); // Added for form


  useEffect(() => {
    setIsClient(true);
    const storedName = localStorage.getItem('loggedInUserName');
    setUserName(storedName);
  }, []);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setDescription(editingItem.description || '');
      try {
        const parsedDate = editingItem.dueDate ? new Date(editingItem.dueDate) : undefined;
        setDueDate(parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : undefined);
      } catch {
        setDueDate(undefined);
      }
      setTagsInput((editingItem.tags || []).join(', '));
      setPriority(editingItem.priority || 'Medium');
      setCompletedForm(editingItem.completed); // Set completed state for form
      setIsFormOpen(true);
    } else {
      if (!isFormOpen) resetForm();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingItem, isFormOpen]);

   const resetForm = () => {
     setTitle('');
     setDescription('');
     setDueDate(undefined);
     setTagsInput('');
     setPriority('Medium');
     setCompletedForm(false); // Reset completed state
     setEditingItem(null);
     setIsPopoverOpen(false);
   };

   const handleFormSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!title.trim()) {
        toast({ title: "Error", description: "Title is required.", variant: "destructive" });
        return;
     };

     const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

     const itemData: Omit<ImportantItem, 'id'> = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate?.toISOString(),
        tags: tags.length > 0 ? tags : undefined,
        priority,
        completed: completedForm, // Use completed state from form
     };

     if (editingItem) {
       const updatedItem: ImportantItem = { ...itemData, id: editingItem.id };
       setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
       toast({ title: "Item Updated", description: `"${updatedItem.title}" updated.` });
     } else {
       const newItem: ImportantItem = { ...itemData, id: crypto.randomUUID() };
       setItems(prev => [...prev, newItem]);
       toast({ title: "Item Added", description: `"${newItem.title}" added.` });
     }

     resetForm();
     setIsFormOpen(false);
   };

   const handleDeleteItem = (id: string) => {
     const itemToDelete = items.find(i => i.id === id);
     setItems(prev => prev.filter(i => i.id !== id));
      if (itemToDelete) {
         toast({ title: "Item Deleted", description: `"${itemToDelete.title}" deleted.`, variant: "destructive" });
      }
   };

   const handleEditClick = (item: ImportantItem) => {
       setEditingItem(item);
   };

   const handleCancelEdit = () => {
        resetForm();
        setIsFormOpen(false);
   };

    const handleDateSelect = (date: Date | undefined) => {
      setDueDate(date);
      setIsPopoverOpen(false); // Close popover on date select
   }

   // Handler to toggle item completion status directly from the list
   const handleToggleComplete = (id: string) => {
     const itemToUpdate = items.find(item => item.id === id);
     if (!itemToUpdate) return;

     const wasCompleted = itemToUpdate.completed;

     setItems(prevItems =>
       prevItems.map(item =>
         item.id === id ? { ...item, completed: !item.completed } : item
       )
     );

     toast({
       title: `Item ${wasCompleted ? 'Marked Incomplete' : 'Marked Complete'}`,
       description: `"${itemToUpdate.title}" marked as ${wasCompleted ? 'incomplete' : 'complete'}.`,
       variant: wasCompleted ? 'default' : 'success',
     });
   };

   // Sort items: Incomplete first, then completed. Within incomplete: High -> Medium -> Low, then by due date. Within completed: by due date.
   const sortedItems = useMemo(() => {
       const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
       return [...items].sort((a, b) => {
         // Sort by completion status first (incomplete first)
         if (a.completed !== b.completed) {
             return a.completed ? 1 : -1;
         }

         // If both incomplete, sort by priority then due date
         if (!a.completed) {
            const priorityCompare = (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
            if (priorityCompare !== 0) return priorityCompare;
         }

         // Sort by due date (earliest first, undefined/null last) for both groups or if priorities are equal
         const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
         const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
         return dateA - dateB;
       });
   }, [items]);

    // Separate into upcoming and completed *after* sorting
   const upcomingItems = sortedItems.filter(item => !item.completed);
   const completedItems = sortedItems.filter(item => item.completed);

   // Render skeleton
   if (!isClient) {
     return (
       <div className="space-y-8">
         <header className="flex justify-between items-center">
           <div>
             <Skeleton className="h-9 w-40 mb-2" />
             <Skeleton className="h-6 w-64" />
           </div>
           <Skeleton className="h-10 w-36 rounded-md" />
         </header>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
         </div>
       </div>
     );
   }


  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2"><AlertTriangle className="h-7 w-7"/> Important</h1>
          <p className="text-lg text-muted-foreground">Track important tasks, deadlines, or reminders.</p>
        </div>
        {userName && (
           <Button onClick={() => { setEditingItem(null); resetForm(); setIsFormOpen(true); }}>
             <Plus className="mr-2 h-4 w-4" /> Add Item
           </Button>
        )}
      </header>

       {isFormOpen && (
         <Card className="border border-border/50 shadow-sm">
           <CardHeader>
             <CardTitle className="text-xl text-primary">{editingItem ? 'Edit Item' : 'Add New Item'}</CardTitle>
           </CardHeader>
           <form onSubmit={handleFormSubmit}>
             <CardContent className="space-y-4">
               <div>
                 <Label htmlFor="imp-title">Title</Label>
                 <Input id="imp-title" value={title} onChange={e => setTitle(e.target.value)} required className="h-10 mt-1"/>
               </div>
               <div>
                 <Label htmlFor="imp-desc">Description (Optional)</Label>
                 <Textarea id="imp-desc" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 min-h-[60px]"/>
               </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label htmlFor="imp-priority">Priority</Label>
                          <Select value={priority} onValueChange={(value) => setPriority(value as ImportantItem['priority'])}>
                             <SelectTrigger className="w-full h-10 mt-1">
                                 <SelectValue placeholder="Select priority" />
                             </SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="Low">Low</SelectItem>
                                 <SelectItem value="Medium">Medium</SelectItem>
                                 <SelectItem value="High">High</SelectItem>
                             </SelectContent>
                         </Select>
                     </div>
                     <div>
                         <Label htmlFor="imp-dueDate">Deadline (Optional)</Label>
                         <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal h-10 mt-1",
                                    !dueDate && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={dueDate}
                                onSelect={handleDateSelect}
                                initialFocus
                                />
                            </PopoverContent>
                         </Popover>
                     </div>
                </div>
               <div>
                 <Label htmlFor="imp-tags">Tags (comma-separated, optional)</Label>
                 <Input id="imp-tags" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="e.g., exam, meeting, paperwork" className="h-10 mt-1"/>
               </div>
                {/* Add Checkbox for Completed Status in Form */}
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="imp-completed"
                        checked={completedForm}
                        onCheckedChange={(checked) => setCompletedForm(!!checked)}
                    />
                    <Label htmlFor="imp-completed">Mark as completed</Label>
                 </div>
             </CardContent>
             <CardFooter className="flex justify-end space-x-2 bg-secondary/20 p-4 border-t">
               <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
               <Button type="submit">{editingItem ? 'Save Changes' : 'Add Item'}</Button>
             </CardFooter>
           </form>
         </Card>
       )}

       {userName ? (
         <>
             {/* Upcoming Items */}
             <div>
                <h2 className="text-2xl font-semibold mb-4 text-primary border-b pb-2">Upcoming Items</h2>
                {upcomingItems.length > 0 ? (
                   <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {upcomingItems.map(item => (
                           <Card key={item.id} className={cn("flex flex-col border shadow-sm transition-shadow duration-200 hover:shadow-lg",
                              item.priority === 'High' ? 'border-destructive/50 hover:border-destructive/30' :
                              item.priority === 'Medium' ? 'border-yellow-500/50 hover:border-yellow-500/30' :
                              'border-border/50 hover:border-primary/30'
                           )}>
                               <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-4 pr-4 pl-4">
                                    <div className="flex items-center h-6 mt-1">
                                      <Checkbox
                                        id={`item-check-${item.id}`}
                                        checked={item.completed}
                                        onCheckedChange={() => handleToggleComplete(item.id)}
                                        aria-label={`Mark item "${item.title}" as complete`}
                                        className="peer size-5 rounded border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                      />
                                    </div>
                                   <div className="grid gap-0.5 flex-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <CardTitle className="text-lg peer-data-[state=checked]:line-through peer-data-[state=checked]:text-muted-foreground">
                                                {item.title}
                                            </CardTitle>
                                             <Badge
                                                variant={item.priority === 'High' ? 'destructive' : item.priority === 'Medium' ? 'outline' : 'secondary'}
                                                className={cn(
                                                     'capitalize whitespace-nowrap',
                                                     item.priority === 'Medium' && 'border-yellow-600 text-yellow-700 dark:border-yellow-400 dark:text-yellow-400'
                                                 )}
                                                >
                                                 {item.priority}
                                             </Badge>
                                        </div>
                                        {item.dueDate && (
                                            <CardDescription className={cn("pt-1 text-xs text-muted-foreground",
                                                isPast(new Date(item.dueDate)) && !isToday(new Date(item.dueDate)) ? 'text-destructive font-semibold' :
                                                isToday(new Date(item.dueDate)) ? 'text-orange-600 dark:text-orange-400 font-semibold' : ''
                                            )}>
                                                Deadline: {format(new Date(item.dueDate), 'PPP')}
                                                {isPast(new Date(item.dueDate)) && !isToday(new Date(item.dueDate)) && ' (Overdue)'}
                                                {isToday(new Date(item.dueDate)) && ' (Today)'}
                                            </CardDescription>
                                        )}
                                   </div>
                               </CardHeader>
                               <CardContent className="flex-grow space-y-3 pt-2 pb-4 pl-12 pr-4">
                                   {item.description && <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>}
                                   <div className="flex flex-wrap gap-1.5 pt-1">
                                     {(item.tags || []).map(tag => <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>)}
                                   </div>
                               </CardContent>
                               <CardFooter className="flex justify-end gap-2 p-3 pt-0 border-t bg-secondary/20">
                                   <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)} aria-label={`Edit item "${item.title}"`}>
                                       <Pencil className="h-4 w-4" />
                                   </Button>
                                   <AlertDialog>
                                     <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" aria-label={`Delete item "${item.title}"`}>
                                           <Trash2 className="h-4 w-4" />
                                        </Button>
                                     </AlertDialogTrigger>
                                     <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete "{item.title}". This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
                       <p className="text-muted-foreground italic">No upcoming important items added yet.</p>
                   </div>
                 )}
             </div>

             {/* Completed Items */}
              {completedItems.length > 0 && (
                 <div className="mt-12">
                     <h2 className="text-2xl font-semibold mb-4 text-success border-b pb-2">Completed Items</h2>
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                         {completedItems.map(item => (
                              <Card key={item.id} className="flex flex-col border border-border/40 bg-card/80 shadow-sm opacity-80 hover:opacity-100 transition-opacity duration-200">
                                 <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-4 pr-4 pl-4">
                                      <div className="flex items-center h-6 mt-1">
                                        <Checkbox
                                          id={`item-check-${item.id}`}
                                          checked={item.completed}
                                          onCheckedChange={() => handleToggleComplete(item.id)}
                                          aria-label={`Mark item "${item.title}" as incomplete`}
                                          className="peer size-5 rounded border-success data-[state=checked]:bg-success data-[state=checked]:text-primary-foreground data-[state=checked]:border-success"
                                        />
                                      </div>
                                     <div className="grid gap-0.5 flex-1">
                                          <CardTitle className="text-lg line-through text-muted-foreground">
                                              {item.title}
                                          </CardTitle>
                                          {item.dueDate && (
                                              <CardDescription className="text-xs text-muted-foreground">
                                                  (Deadline was: {format(new Date(item.dueDate), 'PPP')})
                                              </CardDescription>
                                          )}
                                     </div>
                                     <Badge
                                        variant={item.priority === 'High' ? 'destructive' : item.priority === 'Medium' ? 'outline' : 'secondary'}
                                        className={cn(
                                             'capitalize whitespace-nowrap opacity-70', // Dim the badge slightly
                                             item.priority === 'Medium' && 'border-yellow-600/70 text-yellow-700/70 dark:border-yellow-400/70 dark:text-yellow-400/70'
                                         )}
                                        >
                                         {item.priority}
                                     </Badge>
                                 </CardHeader>
                                 <CardContent className="flex-grow space-y-3 pt-2 pb-4 pl-12 pr-4">
                                     {item.description && <p className="text-sm text-muted-foreground line-clamp-2 italic">{item.description}</p>}
                                      <div className="flex flex-wrap gap-1.5 pt-1">
                                       {(item.tags || []).map(tag => <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>)}
                                     </div>
                                 </CardContent>
                                 <CardFooter className="flex justify-end gap-2 p-3 pt-0 border-t bg-secondary/10">
                                       <AlertDialog>
                                         <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" aria-label={`Delete completed item "${item.title}"`}>
                                               <Trash2 className="h-4 w-4" />
                                            </Button>
                                         </AlertDialogTrigger>
                                         <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Completed Item?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete "{item.title}". This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
           <div className="text-center text-muted-foreground italic py-10">
               Loading items...
           </div>
       )}
    </div>
  );
}
