
export interface Task {
  id: string;
  description: string;
  dueDate: string; // Store as ISO string
  tags: string[];
  completed: boolean;
  notes?: string; // Optional field for assignment notes
}

// You might want to create more specific types later, e.g., Project, Placement, Certificate, Course
// For now, reusing/extending Task might be sufficient for basic CRUD operations.

export interface Project extends Task {
  details?: string;
  status?: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  tags: string[]; // Ensure tags is always an array
}

export interface CollegeProject extends Task {
  course?: string;
  teamMembers?: string[];
  details?: string;
  status?: 'Planning' | 'In Progress' | 'Completed' | 'Submitted' | 'Graded';
  tags: string[]; // Ensure tags is always an array
}

export interface PlacementActivity {
  id: string;
  company: string;
  role: string;
  status: 'Applied' | 'Interviewing' | 'Offer Received' | 'Offer Accepted' | 'Offer Declined' | 'Rejected' | 'Withdrawn';
  applicationDate: string; // ISO String
  interviewDate?: string; // ISO String
  notes?: string;
  link?: string; // Job posting link
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
}

export interface Course {
  id: string;
  title: string;
  platform: string; // e.g., Coursera, Udemy, University
  status: 'Not Started' | 'In Progress' | 'Completed';
  completionDate?: string; // ISO String
  link?: string; // Link to course page
  certificateUrl?: string; // Link to certificate if separate
  rating?: number; // 1-5 star rating
  notes?: string;
}

export interface ImportantItem {
    id: string;
    title: string;
    description?: string;
    dueDate?: string; // ISO String (Optional deadline)
    tags?: string[];
    priority: 'Low' | 'Medium' | 'High';
}

export interface EventItem {
    id: string;
    title: string;
    description?: string;
    startDate: string; // ISO String
    endDate?: string; // ISO String (Optional)
    location?: string;
    link?: string; // Link to event page/details
}
