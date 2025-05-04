"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Save } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskFormProps {
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onEditTask: (task: Task) => void;
  editingTask: Task | null;
  onCancelEdit: () => void;
}

export function TaskForm({ onAddTask, onEditTask, editingTask, onCancelEdit }: TaskFormProps) {
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [tagsInput, setTagsInput] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setDescription(editingTask.description);
      setDueDate(new Date(editingTask.dueDate));
      setTagsInput(editingTask.tags.join(', '));
    } else {
      // Reset form when not editing
      setDescription('');
      setDueDate(new Date());
      setTagsInput('');
    }
  }, [editingTask]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !dueDate) return;

    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    const taskData = {
      description: description.trim(),
      dueDate: dueDate.toISOString(),
      tags,
    };

    if (editingTask) {
      onEditTask({ ...taskData, id: editingTask.id, completed: editingTask.completed });
    } else {
      onAddTask(taskData);
    }

    // Reset form fields only if adding a new task
    if (!editingTask) {
        setDescription('');
        setDueDate(new Date());
        setTagsInput('');
    }
  };

   const handleDateSelect = (date: Date | undefined) => {
      setDueDate(date);
      setIsPopoverOpen(false); // Close popover on date select
   }

   const handleCancel = () => {
     onCancelEdit();
     // Reset form fields when cancelling edit
     setDescription('');
     setDueDate(new Date());
     setTagsInput('');
   }


  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 bg-card rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold text-primary mb-4">{editingTask ? 'Edit Task' : 'Add New Task'}</h2>
      <div>
        <Label htmlFor="description">Task Description</Label>
        <Input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter task description"
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
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g., urgent, assignment, study"
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
          {editingTask ? 'Save Changes' : 'Add Task'}
        </Button>
      </div>
    </form>
  );
}
