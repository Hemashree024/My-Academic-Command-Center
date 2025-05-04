"use client";

import { useState, useEffect } from 'react';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { Task } from '@/types';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

export default function AssignmentsPage() {
  const [userName, setUserName] = useState<string | null>(null);
  // Use username-specific key for localStorage
  const storageKey = userName ? `${userName}-assignments` : 'assignments';
  const [tasks, setTasks] = useLocalStorage<Task[]>(storageKey, []);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Ensure this runs only on the client
    setMounted(true);
    const storedName = localStorage.getItem('loggedInUserName');
    setUserName(storedName);
  }, []);

   // Recalculate storageKey when userName changes
   useEffect(() => {
    if (userName) {
        // Potential logic to migrate tasks if needed, or just start fresh for the user
        // For now, it will just use the new key
    }
   }, [userName]);


  // Handler to add a new task
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: crypto.randomUUID(),
      completed: false,
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
     toast({
      title: "Assignment Added",
      description: `"${newTask.description}" added successfully.`,
    });
  };

  // Handler to toggle task completion status
  const handleToggleComplete = (id: string) => {
    const taskToUpdate = tasks.find(task => task.id === id);
    const wasCompleted = taskToUpdate?.completed;

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );

     if (taskToUpdate) {
        toast({
          title: `Assignment ${wasCompleted ? 'Incomplete' : 'Completed'}`,
          description: `"${taskToUpdate.description}" marked as ${wasCompleted ? 'incomplete' : 'complete'}.`,
          variant: !wasCompleted ? undefined : "default", // 'undefined' uses the default variant styling
        });
     }
  };

  // Handler to delete a task
  const handleDeleteTask = (id: string) => {
     const taskToDelete = tasks.find(task => task.id === id);
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
     if (taskToDelete) {
       toast({
         title: "Assignment Deleted",
         description: `"${taskToDelete.description}" has been deleted.`,
         variant: "destructive",
       });
     }
  };

   // Handler to set the task currently being edited
   const handleSetEditTask = (task: Task) => {
    setEditingTask(task);
   };

   // Handler to save the edited task
  const handleEditTask = (updatedTask: Task) => {
    setTasks(prevTasks =>
      prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task))
    );
    setEditingTask(null);
     toast({
       title: "Assignment Updated",
       description: `"${updatedTask.description}" updated successfully.`,
     });
  };

   // Handler to cancel editing
  const handleCancelEdit = () => {
    setEditingTask(null);
  };


  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-primary mb-2">Assignments</h1>
        <p className="text-lg text-muted-foreground">Track your college assignments.</p>
      </header>

      <TaskForm
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
          editingTask={editingTask}
          onCancelEdit={handleCancelEdit}
        />

      {/* Only render TaskList on the client after mounting and userName is available */}
      {mounted && userName && (
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleSetEditTask}
          />
      )}
       <Toaster /> {/* Ensure Toaster is available */}
    </div>
  );
}
