"use client";

import type { Task } from '@/types';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
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

  const sortedTasks = useMemo(() => {
    // Sort by completion status (incomplete first), then by due date
    return [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (!filterTag) return sortedTasks;
    return sortedTasks.filter(task => task.tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase())));
  }, [sortedTasks, filterTag]);

  const upcomingTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);

  return (
    <div className="space-y-6">
      <Input
        type="text"
        placeholder="Filter assignments by tag..."
        value={filterTag}
        onChange={(e) => setFilterTag(e.target.value)}
        className="mb-4"
        aria-label="Filter assignments by tag"
      />

      {/* Upcoming Assignments */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-primary">Upcoming Assignments</h2>
        {upcomingTasks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTasks.map(task => (
              <Card key={task.id} className="flex flex-col justify-between transition-shadow duration-300 hover:shadow-md">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => onToggleComplete(task.id)}
                    aria-label={`Mark assignment "${task.description}" as complete`}
                    className="mt-1" // Align checkbox slightly better
                  />
                  <div className="grid gap-1 flex-1"> {/* Allow title to take space */}
                    <CardTitle className="text-lg font-medium leading-snug"> {/* Adjust leading */}
                      {task.description}
                    </CardTitle>
                    <CardDescription> {/* Use CardDescription for due date */}
                      Due: {format(new Date(task.dueDate), 'PPP')}
                    </CardDescription>
                  </div>
                </CardHeader>
                 <CardContent className="pt-2 flex-grow space-y-3"> {/* Add space-y */}
                     {task.notes && (
                         <p className="text-sm text-muted-foreground line-clamp-3">{task.notes}</p>
                     )}
                   <div className="flex flex-wrap gap-1">
                    {task.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
                <div className="flex justify-end gap-2 p-4 pt-0">
                   <Button variant="ghost" size="icon" onClick={() => onEditTask(task)} aria-label={`Edit assignment "${task.description}"`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" aria-label={`Delete assignment "${task.description}"`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the assignment "{task.description}".
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
        ) : (
          <p className="text-muted-foreground italic">No upcoming assignments{filterTag && ' matching that tag'}. Great job!</p>
        )}
      </div>

      {/* Completed Assignments */}
      {completedTasks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-success">Completed Assignments</h2>
           <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {completedTasks.map(task => (
              <Card key={task.id} className="opacity-70 transition-opacity duration-300">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                   <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => onToggleComplete(task.id)}
                    aria-label={`Mark assignment "${task.description}" as incomplete`}
                    className="border-success data-[state=checked]:bg-success data-[state=checked]:border-success mt-1" // Align checkbox
                  />
                  <div className="grid gap-1 flex-1">
                    <CardTitle className="text-lg font-medium leading-snug line-through text-muted-foreground">
                      {task.description}
                    </CardTitle>
                     <CardDescription> {/* Use CardDescription */}
                      Due: {format(new Date(task.dueDate), 'PPP')}
                    </CardDescription>
                  </div>
                </CardHeader>
                 <CardContent className="pt-2 space-y-3">
                    {task.notes && (
                         <p className="text-sm text-muted-foreground line-clamp-3">{task.notes}</p>
                     )}
                   <div className="flex flex-wrap gap-1">
                     {task.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                   </div>
                 </CardContent>
                 <div className="flex justify-end gap-2 p-4 pt-0">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" aria-label={`Delete assignment "${task.description}"`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the assignment "{task.description}".
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
    </div>
  );
}
