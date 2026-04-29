import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { AttendanceEntry } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface EntryFormProps {
  initialData?: AttendanceEntry;
  selectedDate: string; // YYYY-MM-DD
  isOpen: boolean;
  onClose: () => void;
  onSave: (entries: Omit<AttendanceEntry, 'id' | 'createdAt'>[]) => void;
  onDelete?: (id: string) => void;
}

export function EntryForm({ initialData, selectedDate, isOpen, onClose, onSave, onDelete }: EntryFormProps) {
  const [nameOrNames, setNameOrNames] = useState('');
  const [jobType, setJobType] = useState<'daily' | 'contract' | 'container'>('daily');
  const [timeIn, setTimeIn] = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');

  // Reset form when reopened or initial data changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setNameOrNames(initialData.name);
        setJobType(initialData.jobType || 'daily');
        setTimeIn(initialData.timeIn);
        setTimeOut(initialData.timeOut);
        setStatus(initialData.status || '');
        setNotes(initialData.notes);
      } else {
        setNameOrNames('');
        setJobType('daily');
        setTimeIn('');
        setTimeOut('');
        setStatus('');
        setNotes('');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameOrNames.trim()) {
      alert("Name is required");
      return;
    }
    
    let namesList: string[] = [];
    if (jobType === 'container') {
      namesList = [nameOrNames.trim()];
    } else {
      namesList = nameOrNames.split('\n').map(n => n.trim()).filter(Boolean);
    }
    
    const entriesToSave = namesList.map(n => ({
      name: n,
      date: initialData ? initialData.date : selectedDate,
      timeIn: jobType === 'daily' ? timeIn : '',
      timeOut: jobType === 'daily' ? timeOut : '',
      status: jobType !== 'daily' ? status : undefined,
      notes: notes.trim(),
      jobType
    }));

    onSave(entriesToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[85vh] sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300 overflow-hidden sm:border-8 sm:border-stone-950">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-stone-900 bg-white sticky top-0 z-10">
          <h2 className="text-xl font-black uppercase tracking-tight text-stone-900">
            {initialData ? 'Edit Entry' : 'New Entry'}
          </h2>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 -mr-1 text-stone-900 hover:opacity-50 transition-opacity bg-stone-100 rounded-full"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Form Body - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-stone-50">
          <form id="entry-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400">Entry Type *</label>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setJobType('daily')}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded transition-colors",
                    jobType === 'daily' ? "bg-stone-900 text-white" : "bg-white text-stone-400 border-2 border-stone-200 hover:border-stone-400"
                  )}
                >
                  Daily Rate
                </button>
                <button 
                  type="button" 
                  onClick={() => setJobType('contract')}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded transition-colors",
                    jobType === 'contract' ? "bg-stone-900 text-white" : "bg-white text-stone-400 border-2 border-stone-200 hover:border-stone-400"
                  )}
                >
                  Contract
                </button>
                <button 
                  type="button" 
                  onClick={() => setJobType('container')}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded transition-colors",
                    jobType === 'container' ? "bg-stone-900 text-white" : "bg-white text-stone-400 border-2 border-stone-200 hover:border-stone-400"
                  )}
                >
                  Container
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="nameOrNames" className="block text-[10px] font-black uppercase tracking-widest text-stone-400">
                {jobType === 'container'
                  ? 'Reference / Details *'
                  : (initialData ? 'Worker Name *' : 'Worker Name(s) * (One per line)')}
              </label>
              <textarea
                id="nameOrNames"
                value={nameOrNames}
                onChange={(e) => setNameOrNames(e.target.value)}
                rows={initialData ? 2 : 3}
                className="w-full rounded bg-white border-2 border-stone-900 px-4 py-3 text-sm font-bold uppercase text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-200 transition-shadow resize-none"
                placeholder={jobType === 'container' ? "CONT123456\nRepair #82" : "Marcus J. Chen\nSarah Al-Fayad"}
                required
                autoFocus
              />
            </div>

            {jobType === 'daily' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="timeIn" className="block text-[10px] font-black uppercase tracking-widest text-stone-400">Time In</label>
                  <input
                    type="time"
                    id="timeIn"
                    value={timeIn}
                    onChange={(e) => setTimeIn(e.target.value)}
                    className="w-full rounded bg-white border-2 border-stone-900 px-4 py-3 text-sm font-black text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-200 transition-shadow"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="timeOut" className="block text-[10px] font-black uppercase tracking-widest text-stone-400">Time Out</label>
                  <input
                    type="time"
                    id="timeOut"
                    value={timeOut}
                    onChange={(e) => setTimeOut(e.target.value)}
                    className="w-full rounded bg-white border-2 border-stone-900 px-4 py-3 text-sm font-black text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-200 transition-shadow"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="status" className="block text-[10px] font-black uppercase tracking-widest text-stone-400">Status</label>
                <input
                  type="text"
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded bg-white border-2 border-stone-900 px-4 py-3 text-sm font-bold uppercase text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-200 transition-shadow"
                  placeholder="e.g. IN PROG, PENDING, DONE..."
                />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="notes" className="block text-[10px] font-black uppercase tracking-widest text-stone-400">Job Contact / Notes</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded bg-white border-2 border-stone-900 px-4 py-3 text-sm font-mono font-bold text-stone-900 focus:outline-none focus:ring-4 focus:ring-stone-200 transition-shadow resize-none"
                placeholder="+63 917... or Job ref..."
              />
            </div>

          </form>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t-2 border-stone-900 bg-white sticky bottom-0 z-10 pb-[max(1rem,env(safe-area-inset-bottom))] flex gap-2">
          {initialData && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(initialData.id);
                onClose();
              }}
              className="px-4 flex items-center justify-center bg-white border-2 border-red-500 hover:bg-red-50 text-red-500 rounded active:scale-[0.98] transition-all"
            >
              <Trash2 size={24} strokeWidth={2.5} />
            </button>
          )}
          <button
            type="submit"
            form="entry-form"
            className="flex-1 flex items-center justify-center bg-black hover:bg-stone-800 text-white font-black uppercase tracking-wider py-4 px-4 rounded active:scale-[0.98] transition-transform text-sm"
          >
            {initialData ? 'Save Changes' : 'Save Entry'}
          </button>
        </div>

      </div>
    </div>
  );
}
