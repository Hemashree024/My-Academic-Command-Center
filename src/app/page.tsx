"use client";

import { useState, useEffect } from 'react';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { Task } from '@/types';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [mounted, setMounted] = useState(false); // State to track client-side mounting
  const { toast } = useToast();

  // Set mounted to true only on the client-side after initial render
  useEffect(() => {
    setMounted(true);
  }, []);


  // Handler to add a new task
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: crypto.randomUUID(), // Simple ID generation
      completed: false,
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
     toast({
      title: "Task Added",
      description: `"${newTask.description}" added successfully.`,
    });
  };

  // Handler to toggle task completion status
  const handleToggleComplete = (id: string) => {
    const taskToUpdate = tasks.find(task => task.id === id);
    const wasCompleted = taskToUpdate?.completed; // Capture state before toggle

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );

    // Use the captured state to determine the toast message
     if (taskToUpdate) {
        toast({
          title: `Task ${wasCompleted ? 'Incomplete' : 'Completed'}`,
          description: `"${taskToUpdate.description}" marked as ${wasCompleted ? 'incomplete' : 'complete'}.`,
          // Variant logic remains the same based on the *new* state (which is !wasCompleted)
          variant: !wasCompleted ? undefined : "default",
        });
     }
  };

  // Handler to delete a task
  const handleDeleteTask = (id: string) => {
     const taskToDelete = tasks.find(task => task.id === id);
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
     if (taskToDelete) {
       toast({
         title: "Task Deleted",
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
    setEditingTask(null); // Clear editing state
     toast({
       title: "Task Updated",
       description: `"${updatedTask.description}" updated successfully.`,
     });
  };

   // Handler to cancel editing
  const handleCancelEdit = () => {
    setEditingTask(null);
  };


  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-2">NextUp</h1>
        <p className="text-lg text-muted-foreground">Your College To-Do List</p>
      </header>

      <TaskForm
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
          editingTask={editingTask}
          onCancelEdit={handleCancelEdit}
        />

      {/* Only render TaskList on the client after mounting */}
      {mounted && (
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleSetEditTask} // Pass the function to initiate editing
          />
      )}
       <Toaster />
    </main>
  );
}
