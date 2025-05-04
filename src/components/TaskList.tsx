
"use client";

import type { Task } from '@/types';
import { useState, useEffect, useMemo } from 'react'; // Added useEffect
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Filter, Info } from 'lucide-react';
import { format, isPast, differenceInDays, isToday } from 'date-fns'; // Correctly import isToday
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
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { cn } from '@/lib/utils'; // Import cn for conditional classes

// Add notes to Task if it might exist
interface AssignmentTask extends Task {
    notes?: string;
}

interface AssignmentListProps {
  tasks: AssignmentTask[];
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: AssignmentTask) => void;
}

export function TaskList({ tasks, onToggleComplete, onDeleteTask, onEditTask }: AssignmentListProps) {
  const [filterTag, setFilterTag] = useState('');
  const [isClient, setIsClient] = useState(false); // State to track client mount

  useEffect(() => {
    setIsClient(true); // Indicate component has mounted
  }, []);

  const sortedTasks = useMemo(() => {
    // Ensure tasks is always an array, even if initially undefined or null from localStorage hydration
    const validTasks = Array.isArray(tasks) ? tasks : [];
    return [...validTasks].sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1; // Incomplete first
        }
        // Then sort by due date ascending
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (!filterTag) return sortedTasks;
    const lowerFilterTag = filterTag.toLowerCase();
    return sortedTasks.filter(task =>
        task.tags.some(tag => tag.toLowerCase().includes(lowerFilterTag)) ||
        task.description.toLowerCase().includes(lowerFilterTag) // Also filter by description
    );
  }, [sortedTasks, filterTag]);

  // Separate lists *after* filtering
  const upcomingTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);

  const getDueDateStatus = (dueDate: string): { text: string; className: string } => {
      const date = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Compare against start of today
      date.setHours(0,0,0,0); // Compare start of due date

      if (isPast(date) && !isToday(date)) {
          return { text: 'Overdue', className: 'text-destructive font-semibold' };
      }
      const diffDays = differenceInDays(date, today);

      if (diffDays === 0) {
          return { text: 'Due Today', className: 'text-orange-600 dark:text-orange-400 font-semibold' }; // Use a distinct color like orange
      }
      if (diffDays === 1) {
          return { text: 'Due Tomorrow', className: 'text-yellow-600 dark:text-yellow-400' }; // Use yellow/amber for tomorrow
      }
      if (diffDays <= 7) {
          return { text: `Due in ${diffDays} days`, className: 'text-primary' };
      }
      return { text: `Due ${format(date, 'PPP')}`, className: 'text-muted-foreground' };
  };


  // Don't render until client has mounted to avoid hydration mismatch
  if (!isClient) {
     return (
         <div className="space-y-8">
             <Skeleton className="h-11 w-full mb-4" /> {/* Filter Input Skeleton */}
             <div>
                 <Skeleton className="h-8 w-1/3 mb-4" /> {/* Upcoming Header Skeleton */}
                 <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={`upcoming-skel-${i}`} className="h-48 rounded-lg" />)} {/* Task Card Skeleton */}
                 </div>
             </div>
             {/* Optionally add skeleton for completed section if it might exist */}
             <div className="mt-12">
                 <Skeleton className="h-8 w-1/3 mb-4" /> {/* Completed Header Skeleton */}
                 <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                     {[...Array(2)].map((_, i) => <Skeleton key={`completed-skel-${i}`} className="h-40 rounded-lg opacity-70" />)} {/* Completed Task Card Skeleton */}
                 </div>
             </div>
         </div>
     );
  }


  return (
    <div className="space-y-8">
      <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filter assignments by tag or description..."
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="mb-4 pl-10 h-11" // Add padding for icon
            aria-label="Filter assignments by tag or description"
          />
      </div>


      {/* Upcoming Assignments */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-primary border-b pb-2">Upcoming</h2>
        {upcomingTasks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTasks.map(task => {
               const dueDateStatus = getDueDateStatus(task.dueDate);
               return (
              <Card key={task.id} className="flex flex-col justify-between border border-border/50 shadow-sm transition-shadow duration-200 hover:shadow-lg hover:border-primary/30">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-4 pr-4 pl-4"> {/* Adjusted gap and padding */}
                   {/* Custom Checkbox Styling */}
                   <div className="flex items-center h-6 mt-1"> {/* Align checkbox with title */}
                     <Checkbox
                       id={`task-${task.id}`}
                       checked={task.completed}
                       onCheckedChange={() => onToggleComplete(task.id)}
                       aria-label={`Mark assignment "${task.description}" as complete`}
                       className="peer size-5 rounded border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                     />
                   </div>
                  <div className="grid gap-0.5 flex-1">
                    <CardTitle className="text-lg font-medium leading-snug peer-data-[state=checked]:line-through peer-data-[state=checked]:text-muted-foreground">
                      {task.description}
                    </CardTitle>
                    <CardDescription className={cn("text-sm", dueDateStatus.className)}>
                      {dueDateStatus.text}
                    </CardDescription>
                  </div>
                </CardHeader>
                 <CardContent className="pt-2 pb-4 flex-grow space-y-3 pl-12 pr-4"> {/* Indent content relative to checkbox */}
                     {task.notes && (
                         <p className="text-sm text-muted-foreground line-clamp-3">{task.notes}</p>
                     )}
                   <div className="flex flex-wrap gap-1.5"> {/* Adjusted gap */}
                    {task.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
                {/* Footer aligned to bottom */}
                <div className="flex justify-end gap-1 p-3 pt-0 border-t bg-secondary/20 mt-auto">
                   <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={() => onEditTask(task)} aria-label={`Edit assignment "${task.description}"`}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" aria-label={`Delete assignment "${task.description}"`}>
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the assignment "{task.description}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteTask(task.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                         >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
               );
            })}
          </div>
        ) : (
          <div className="text-center py-8 px-4 border border-dashed rounded-lg bg-card/50">
             <Info className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
             <p className="text-muted-foreground italic">
                {filterTag
                    ? 'No upcoming assignments match your filter.'
                    : 'No upcoming assignments. Add one or take a break!'
                }
             </p>
          </div>
        )}
      </div>

      {/* Completed Assignments - Conditionally render the entire section */}
      {completedTasks.length > 0 && (
        <div className="mt-12"> {/* Increased margin top */}
          <h2 className="text-2xl font-semibold mb-4 text-success border-b pb-2">Completed</h2>
           <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {completedTasks.map(task => (
              <Card key={task.id} className="flex flex-col justify-between border border-border/40 bg-card/80 shadow-sm opacity-80 hover:opacity-100 transition-opacity duration-200">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-4 pr-4 pl-4"> {/* Adjusted gap and padding */}
                   <div className="flex items-center h-6 mt-1"> {/* Align checkbox */}
                     <Checkbox
                       id={`task-${task.id}`}
                       checked={task.completed}
                       onCheckedChange={() => onToggleComplete(task.id)}
                       aria-label={`Mark assignment "${task.description}" as incomplete`}
                       className="peer size-5 rounded border-success data-[state=checked]:bg-success data-[state=checked]:text-primary-foreground data-[state=checked]:border-success"
                     />
                   </div>
                  <div className="grid gap-0.5 flex-1">
                    <CardTitle className="text-lg font-medium leading-snug line-through text-muted-foreground">
                      {task.description}
                    </CardTitle>
                     <CardDescription className="text-sm text-muted-foreground">
                      Completed (Originally due: {format(new Date(task.dueDate), 'PPP')})
                    </CardDescription>
                  </div>
                </CardHeader>
                 <CardContent className="pt-2 pb-4 flex-grow space-y-3 pl-12 pr-4"> {/* Indent content */}
                    {task.notes && (
                         <p className="text-sm text-muted-foreground line-clamp-2 italic">{task.notes}</p>
                     )}
                   <div className="flex flex-wrap gap-1.5"> {/* Adjusted gap */}
                     {task.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
                    ))}
                   </div>
                 </CardContent>
                 <div className="flex justify-end gap-1 p-3 pt-0 border-t bg-secondary/10 mt-auto"> {/* Footer aligned to bottom */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" aria-label={`Delete completed assignment "${task.description}"`}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the completed assignment "{task.description}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteTask(task.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                 </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      {/* Message if filtered and no completed tasks */}
      {filterTag && completedTasks.length === 0 && upcomingTasks.length > 0 && (
          <p className="text-muted-foreground italic text-center mt-4">No completed assignments match your filter.</p>
      )}
    </div>
  );
}
