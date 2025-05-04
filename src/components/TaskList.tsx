"use client";

import type { Task } from '@/types';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
}

export function TaskList({ tasks, onToggleComplete, onDeleteTask, onEditTask }: TaskListProps) {
  const [filterTag, setFilterTag] = useState('');

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
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
        placeholder="Filter by tag..."
        value={filterTag}
        onChange={(e) => setFilterTag(e.target.value)}
        className="mb-4"
      />

      {/* Upcoming Tasks */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-primary">Upcoming Tasks</h2>
        {upcomingTasks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTasks.map(task => (
              <Card key={task.id} className="flex flex-col justify-between transition-shadow duration-300 hover:shadow-md">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => onToggleComplete(task.id)}
                    aria-label={`Mark task "${task.description}" as complete`}
                  />
                  <div className="grid gap-1">
                    <CardTitle className="text-lg font-medium leading-none">
                      {task.description}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Due: {format(new Date(task.dueDate), 'PPP')} {/* Nicer date format */}
                    </p>
                  </div>
                </CardHeader>
                 <CardContent className="pt-2 flex-grow">
                   <div className="flex flex-wrap gap-1 mb-4">
                    {task.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>

                </CardContent>
                <div className="flex justify-end gap-2 p-4 pt-0">
                   <Button variant="ghost" size="icon" onClick={() => onEditTask(task)} aria-label={`Edit task "${task.description}"`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" aria-label={`Delete task "${task.description}"`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the task "{task.description}".
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
          <p className="text-muted-foreground italic">No upcoming tasks{filterTag && ' matching that tag'}.</p>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-success">Completed Tasks</h2>
           <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {completedTasks.map(task => (
              <Card key={task.id} className="opacity-70 transition-opacity duration-300">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                   <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => onToggleComplete(task.id)}
                    aria-label={`Mark task "${task.description}" as incomplete`}
                    className="border-success data-[state=checked]:bg-success data-[state=checked]:border-success"
                  />
                  <div className="grid gap-1">
                    <CardTitle className="text-lg font-medium leading-none line-through text-muted-foreground">
                      {task.description}
                    </CardTitle>
                     <p className="text-sm text-muted-foreground">
                      Due: {format(new Date(task.dueDate), 'PPP')}
                    </p>
                  </div>
                </CardHeader>
                 <CardContent className="pt-2">
                   <div className="flex flex-wrap gap-1 mb-4">
                     {task.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                   </div>
                 </CardContent>
                 <div className="flex justify-end gap-2 p-4 pt-0">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" aria-label={`Delete task "${task.description}"`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the task "{task.description}".
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
