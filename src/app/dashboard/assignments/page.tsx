
"use client";

import { useState, useEffect } from 'react';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { Task } from '@/types';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Button } from '@/components/ui/button'; // Import Button

export default function AssignmentsPage() {
  const [userName, setUserName] = useState<string | null>(null);
  // Use username-specific key for localStorage
  const storageKey = userName ? `${userName}-assignments` : 'assignments-fallback'; // Added fallback key
  const [tasks, setTasks] = useLocalStorage<Task[]>(storageKey, []);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false); // Control form visibility
  const [isClient, setIsClient] = useState(false); // State to track client mount
  const { toast } = useToast();

  useEffect(() => {
    // Ensure this runs only on the client
    setIsClient(true);
    const storedName = localStorage.getItem('loggedInUserName');
    setUserName(storedName);
  }, []);

   // Recalculate storageKey and potentially load data when userName changes
   useEffect(() => {
    if (userName) {
        // The useLocalStorage hook handles loading data based on the key change
        // Reset editing state if user changes (though unlikely in this flow)
        setEditingTask(null);
        setIsFormVisible(false);
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
      variant: 'default' // Explicitly default, though optional
    });
    setIsFormVisible(false); // Hide form after adding
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
          variant: wasCompleted ? 'default' : 'success', // Use success variant for completion
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

   // Handler to set the task currently being edited and show form
   const handleSetEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormVisible(true); // Show form for editing
   };

   // Handler to save the edited task
  const handleEditTask = (updatedTask: Task) => {
    setTasks(prevTasks =>
      prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task))
    );
    setEditingTask(null); // Clear editing state
    setIsFormVisible(false); // Hide form after editing
     toast({
       title: "Assignment Updated",
       description: `"${updatedTask.description}" updated successfully.`,
       variant: 'default'
     });
  };

   // Handler to cancel editing and hide form
  const handleCancelEdit = () => {
    setEditingTask(null);
    setIsFormVisible(false); // Hide form on cancel
  };

  // Handler to show the form for adding a new task
  const handleShowAddForm = () => {
    setEditingTask(null); // Ensure not in editing mode
    setIsFormVisible(true);
  }

  // Render skeleton or null during SSR and initial client render before mount
  if (!isClient) {
     return (
         <div className="space-y-8">
             <header className="border-b pb-4 mb-6">
                <Skeleton className="h-9 w-1/3 mb-1" />
                <Skeleton className="h-6 w-2/3" />
             </header>
             <div className="space-y-6">
                 <Skeleton className="h-10 w-full mb-4" />
                 <Skeleton className="h-8 w-1/3 mb-4" />
                 <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
                 </div>
             </div>
         </div>
     );
  }

  return (
    <div className="space-y-8">
      <header className="border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold text-primary tracking-tight mb-1">Assignments</h1>
        <p className="text-lg text-muted-foreground">Track your upcoming and completed assignments.</p>
      </header>

      {/* Show Form or Add Button - Render only after client mount and user is identified */}
      {userName ? (
          isFormVisible ? (
               <TaskForm
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  editingTask={editingTask}
                  onCancelEdit={handleCancelEdit}
                />
          ) : (
              <div className="flex justify-end">
                 <Button onClick={handleShowAddForm}>Add New Assignment</Button>
              </div>
          )
      ) : null }


      {/* Task List - Render only after client mount and user is identified */}
      {userName ? (
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleSetEditTask} // Pass the handler to show form for edit
          />
      ) : (
          // You might want a different message if the user isn't logged in yet
           <div className="text-center text-muted-foreground italic py-10">
               Loading assignments...
           </div>
      )}
       {/* <Toaster /> Already in root layout */}
    </div>
  );
}
