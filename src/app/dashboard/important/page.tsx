
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Info, AlertTriangle } from 'lucide-react';
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
import { format } from 'date-fns';

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

   // Sort items: High -> Medium -> Low, then by due date (earliest first, undefined last)
   const sortedItems = useMemo(() => {
       const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
       return [...items].sort((a, b) => {
         const priorityCompare = (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
         if (priorityCompare !== 0) return priorityCompare;

         const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
         const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
         return dateA - dateB;
       });
   }, [items]);

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
             </CardContent>
             <CardFooter className="flex justify-end space-x-2 bg-secondary/20 p-4 border-t">
               <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
               <Button type="submit">{editingItem ? 'Save Changes' : 'Add Item'}</Button>
             </CardFooter>
           </form>
         </Card>
       )}

       {userName ? (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedItems.length > 0 ? sortedItems.map(item => (
                 <Card key={item.id} className={cn("flex flex-col border shadow-sm transition-shadow duration-200 hover:shadow-lg",
                    item.priority === 'High' ? 'border-destructive/50 hover:border-destructive/30' :
                    item.priority === 'Medium' ? 'border-yellow-500/50 hover:border-yellow-500/30' :
                    'border-border/50 hover:border-primary/30'
                 )}>
                     <CardHeader className="pb-3">
                         <div className="flex justify-between items-start gap-2">
                             <CardTitle className="text-lg">{item.title}</CardTitle>
                              <Badge
                                variant={item.priority === 'High' ? 'destructive' : item.priority === 'Medium' ? 'outline' : 'secondary'}
                                className={cn(
                                     item.priority === 'Medium' && 'border-yellow-600 text-yellow-700 dark:border-yellow-400 dark:text-yellow-400'
                                 )}
                                >
                                 {item.priority}
                             </Badge>
                         </div>
                         {item.dueDate && <CardDescription className="pt-1 text-xs text-muted-foreground">Deadline: {format(new Date(item.dueDate), 'PPP')}</CardDescription>}
                     </CardHeader>
                     <CardContent className="flex-grow space-y-3 pt-0 pb-4 pl-6 pr-4">
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
             )) : (
                 <div className="col-span-full text-center py-10 px-4 border border-dashed rounded-lg">
                     <Info className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                     <p className="text-muted-foreground italic">No important items added yet. Click "Add Item" to get started.</p>
                 </div>
             )}
         </div>
        ) : (
           <div className="text-center text-muted-foreground italic py-10">
               Loading items...
           </div>
       )}
    </div>
  );
}
