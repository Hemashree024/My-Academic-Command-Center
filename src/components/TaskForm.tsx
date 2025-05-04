"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { Task } from '@/types'; // Keep Task type for assignments
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Use Card for structure

interface AssignmentFormProps {
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onEditTask: (task: Task) => void;
  editingTask: Task | null;
  onCancelEdit: () => void;
}

export function TaskForm({ onAddTask, onEditTask, editingTask, onCancelEdit }: AssignmentFormProps) {
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setDescription(editingTask.description);
      // Handle potential invalid date strings gracefully
      try {
        const parsedDate = new Date(editingTask.dueDate);
        setDueDate(isNaN(parsedDate.getTime()) ? new Date() : parsedDate);
      } catch {
        setDueDate(new Date());
      }
      setTagsInput(editingTask.tags.join(', '));
      setNotes((editingTask as any).notes || '');
    } else {
      resetForm();
    }
  }, [editingTask]);

   const resetForm = () => {
        setDescription('');
        setDueDate(new Date());
        setTagsInput('');
        setNotes('');
        setIsPopoverOpen(false); // Ensure popover is closed
        // Don't reset editingTask here, parent handles it via onCancelEdit
   }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !dueDate) return;

    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    const taskData = {
      description: description.trim(),
      dueDate: dueDate.toISOString(),
      tags,
      notes: notes.trim() || undefined,
    };

    if (editingTask) {
      onEditTask({ ...taskData, id: editingTask.id, completed: editingTask.completed });
    } else {
      onAddTask(taskData);
    }

    // Parent component will handle closing the form or clearing editing state
    // Only reset local form state if ADDING a new task
    if (!editingTask) {
        resetForm();
    }
    // Close popover if open
    setIsPopoverOpen(false);
  };

   const handleDateSelect = (date: Date | undefined) => {
      setDueDate(date);
      setIsPopoverOpen(false); // Close popover on date select
   }

   const handleCancel = () => {
     onCancelEdit(); // Call parent's cancel handler which should reset editingTask
     resetForm(); // Also reset local form state
   }


  return (
     <Card className="mb-8 border border-border/50 shadow-sm">
         <CardHeader>
             <CardTitle className="text-xl text-primary">
                {editingTask ? 'Edit Assignment' : 'Add New Assignment'}
             </CardTitle>
         </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5"> {/* Increased spacing */}
              <div className="space-y-1.5"> {/* Group label and input */}
                <Label htmlFor="description" className="font-medium">Assignment Description</Label>
                <Input
                  id="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Calculus Homework 5"
                  required
                  className="mt-1 h-10" // Standard input height
                />
              </div>

               <div className="space-y-1.5">
                <Label htmlFor="dueDate" className="font-medium">Due Date</Label>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal h-10", // Standard height
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
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} // Disable past dates
                    />
                  </PopoverContent>
                </Popover>
              </div>

               <div className="space-y-1.5">
                  <Label htmlFor="notes" className="font-medium">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Specific instructions, chapter references, required format..."
                    className="mt-1 min-h-[60px]" // Adjusted height
                    rows={3}
                  />
               </div>


               <div className="space-y-1.5">
                <Label htmlFor="tags" className="font-medium">Tags (Optional, comma-separated)</Label>
                <Input
                  id="tags"
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g., urgent, math, reading, research"
                  className="mt-1 h-10"
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end space-x-3 bg-secondary/20 p-4 border-t">
                 {editingTask && (
                    <Button type="button" variant="outline" onClick={handleCancel}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                 )}
                <Button type="submit">
                   {editingTask ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {editingTask ? 'Save Changes' : 'Add Assignment'}
                </Button>
            </CardFooter>
        </form>
     </Card>
  );
}
