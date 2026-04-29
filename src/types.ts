export interface AttendanceEntry {
  id: string;
  date: string; // Stored in YYYY-MM-DD
  name: string;
  timeIn: string;
  timeOut: string;
  status?: string;
  notes: string;
  jobType?: 'daily' | 'contract' | 'container';
  billed?: boolean;
  createdAt: number;
}
