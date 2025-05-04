"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { Task } from '@/types'; // Keep Task type for assignments
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Save } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea

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
  const [notes, setNotes] = useState(''); // Add state for notes
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setDescription(editingTask.description);
      setDueDate(new Date(editingTask.dueDate));
      setTagsInput(editingTask.tags.join(', '));
      setNotes((editingTask as any).notes || ''); // Assuming notes might be added to Task type later
    } else {
      // Reset form when not editing
      resetForm();
    }
  }, [editingTask]);

   const resetForm = () => {
        setDescription('');
        setDueDate(new Date());
        setTagsInput('');
        setNotes('');
        // Don't reset editingTask here, let parent handle it via onCancelEdit
   }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !dueDate) return;

    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    const taskData = {
      description: description.trim(),
      dueDate: dueDate.toISOString(),
      tags,
      notes: notes.trim() || undefined, // Add notes to task data
    };

    if (editingTask) {
      onEditTask({ ...taskData, id: editingTask.id, completed: editingTask.completed });
    } else {
      onAddTask(taskData);
    }

    // Reset form fields only if adding a new task, otherwise handled by onCancelEdit or successful save
    if (!editingTask) {
        resetForm();
    }
    // Parent component will handle closing the form or clearing editing state
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
    <form onSubmit={handleSubmit} className="mb-8 p-6 bg-card rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold text-primary mb-4">{editingTask ? 'Edit Assignment' : 'Add New Assignment'}</h2>
      <div>
        <Label htmlFor="description">Assignment Description</Label>
        <Input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Calculus Homework 5"
          required
          className="mt-1"
        />
      </div>

       <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal mt-1",
                !dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

       <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Specific instructions, chapter references"
            className="mt-1"
          />
       </div>


       <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g., urgent, math, reading"
          className="mt-1"
        />
      </div>

      <div className="flex justify-end space-x-2">
         {editingTask && (
            <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
            </Button>
         )}
        <Button type="submit" variant={editingTask ? "default" : "default"}>
           {editingTask ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {editingTask ? 'Save Changes' : 'Add Assignment'}
        </Button>
      </div>
    </form>
  );
}
