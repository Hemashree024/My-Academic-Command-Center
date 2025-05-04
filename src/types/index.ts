export interface Task {
  id: string;
  description: string;
  dueDate: string; // Store as ISO string
  tags: string[];
  completed: boolean;
}
