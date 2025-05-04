
export interface Task {
  id: string;
  description: string;
  dueDate: string; // Store as ISO string
  tags: string[];
  completed: boolean;
  notes?: string; // Optional field for assignment notes
}

// Base interface for items that can be marked completed and have optional details/tags
interface CompletableItem {
    id: string;
    completed: boolean;
    details?: string; // Reuse details field name
    notes?: string; // Reuse notes field name
    tags?: string[]; // Ensure tags is always an array or undefined
}


export interface Project extends CompletableItem {
  description: string; // Keep description for projects
  dueDate: string; // ISO string
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  // completed field will be synced with status === 'Completed'
}

export interface CollegeProject extends CompletableItem {
  description: string; // Keep description
  course?: string;
  teamMembers?: string[];
  dueDate: string; // ISO string
  status: 'Planning' | 'In Progress' | 'Completed' | 'Submitted' | 'Graded';
  // completed field will be synced with status being 'Completed', 'Submitted', or 'Graded'
}

export interface PlacementActivity extends CompletableItem {
  company: string;
  role: string;
  status: 'Applied' | 'Interviewing' | 'Offer Received' | 'Offer Accepted' | 'Offer Declined' | 'Rejected' | 'Withdrawn';
  applicationDate: string; // ISO String
  interviewDate?: string; // ISO String
  link?: string; // Job posting link
  // completed field will be true if status is Offer Accepted, Offer Declined, Rejected, or Withdrawn
}

export interface Certificate {
  id: string;
  title: string;
  issuingOrganization: string;
  issueDate: string; // ISO String
  expirationDate?: string; // ISO String
  credentialId?: string;
  credentialUrl?: string;
  skills?: string[]; // Skills gained
  notes?: string;
  // Certificates are inherently 'completed' upon adding. No 'completed' field needed.
}

export interface Course extends CompletableItem {
  title: string;
  platform: string; // e.g., Coursera, Udemy, University
  status: 'Not Started' | 'In Progress' | 'Completed';
  completionDate?: string; // ISO String
  link?: string; // Link to course page
  certificateUrl?: string; // Link to certificate if separate
  rating?: number; // 1-5 star rating
  // completed field will be synced with status === 'Completed'
}

export interface ImportantItem extends CompletableItem {
    title: string;
    dueDate?: string; // ISO String (Optional deadline)
    priority: 'Low' | 'Medium' | 'High';
    // completed field added via CompletableItem
}

export interface EventItem {
    id: string;
    title: string;
    description?: string;
    startDate: string; // ISO String
    endDate?: string; // ISO String (Optional)
    location?: string;
    link?: string; // Link to event page/details
    // Events are time-based, past/upcoming distinction serves as completion status.
}

// Combine all possible item types for potential future use (e.g., unified search)
export type DashboardItem = Task | Project | CollegeProject | PlacementActivity | Certificate | Course | ImportantItem | EventItem;
