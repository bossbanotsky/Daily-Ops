import React, { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { Plus, ChevronLeft, ChevronRight, User, Clock, Briefcase, Trash2, Edit2 } from 'lucide-react';
import { useAttendanceData } from './hooks/useAttendanceData';
import { EntryForm } from './components/EntryForm';
import { AttendanceEntry } from './types';
import { cn } from './lib/utils';

const formatTimeAMPM = (timeStr?: string) => {
  if (!timeStr) return '--:--';
  const parts = timeStr.split(':');
  if (parts.length !== 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  return `${hours}:${minutes} ${ampm}`;
};

export default function App() {
  const { entries, addEntries, updateEntry, deleteEntry } = useAttendanceData();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // State for Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AttendanceEntry | undefined>();
  const [activeTab, setActiveTab] = useState<'daily' | 'contract' | 'container' | 'billing'>('daily');

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const todaysEntries = entries.filter(e => e.date === dateStr).sort((a,b) => b.createdAt - a.createdAt);

  const handlePrevDay = () => setCurrentDate(prev => subDays(prev, 1));
  const handleNextDay = () => setCurrentDate(prev => addDays(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  const openNewEntry = () => {
    setEditingEntry(undefined);
    setIsFormOpen(true);
  };

  const openEditEntry = (entry: AttendanceEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleSaveEntry = (entriesData: Omit<AttendanceEntry, 'id' | 'createdAt'>[]) => {
    if (editingEntry && entriesData.length === 1) {
      updateEntry(editingEntry.id, entriesData[0]);
    } else {
      addEntries(entriesData);
    }
  };

  const dailyEntries = todaysEntries.filter(e => e.jobType !== 'contract' && e.jobType !== 'container');
  const contractEntries = todaysEntries.filter(e => e.jobType === 'contract');
  const containerEntries = entries.filter(e => e.jobType === 'container' && !e.billed).sort((a,b) => b.createdAt - a.createdAt);
  const billingEntries = entries.filter(e => e.jobType === 'container' && e.billed).sort((a,b) => b.createdAt - a.createdAt);

  const renderEntryItem = (entry: AttendanceEntry, index: number) => (
    <div 
      key={entry.id} 
      onClick={() => openEditEntry(entry)}
      className="flex gap-3 border-b border-stone-100 pb-3 hover:bg-stone-50 px-2 pt-2 rounded transition-colors cursor-pointer group items-start"
    >
      {(activeTab === 'container' || activeTab === 'billing') && (
        <span className="text-[10px] font-black text-stone-400 mt-1 w-4 text-right shrink-0">
          {index + 1}.
        </span>
      )}
      {activeTab !== 'daily' ? (
        <div className="flex flex-col w-16 shrink-0 pt-0.5">
          <span className="text-[10px] font-black text-stone-900 uppercase truncate">
            {entry.status || 'NO STATUS'}
          </span>
        </div>
      ) : (
        <div className="flex flex-col w-14 shrink-0">
          <span className="text-[10px] font-black text-stone-900">{formatTimeAMPM(entry.timeIn)}</span>
          <span className="text-[10px] font-bold text-stone-400">{formatTimeAMPM(entry.timeOut)}</span>
        </div>
      )}
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1 pr-2 overflow-hidden flex-1">
            <span className="font-black text-stone-900 uppercase text-sm leading-tight whitespace-pre-wrap break-words">
              {entry.name}
            </span>
            {(activeTab === 'container' || activeTab === 'billing') && (
              <div className="self-start">
                <span className="text-[9px] font-black uppercase text-stone-400 border border-stone-200 px-1 py-0.5 rounded-sm whitespace-nowrap bg-white">
                  {format(entry.createdAt, 'MMM d')}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'container' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateEntry(entry.id, { billed: true });
                }}
                className="px-2 py-0.5 bg-stone-900 text-white rounded text-[8px] font-black uppercase opacity-70 hover:opacity-100 transition-all active:scale-95"
              >
                Bill
              </button>
            )}
            {activeTab === 'billing' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateEntry(entry.id, { billed: false });
                }}
                className="px-2 py-0.5 bg-stone-200 text-stone-600 rounded text-[8px] font-black uppercase hover:opacity-100 transition-all active:scale-95"
              >
                Unbill
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}
              className="p-1 opacity-50 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-stone-400 hover:text-red-600 transition-all active:scale-95 -mt-1 -mr-1"
            >
              <Trash2 size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
        {entry.notes && (
          <span className="text-[10px] font-mono text-stone-500 font-bold mt-0.5 whitespace-pre-wrap break-words">
            {entry.notes}
          </span>
        )}
      </div>
    </div>
  );

  const renderEntryGroup = (groupEntries: AttendanceEntry[], title: string) => {
    if (groupEntries.length === 0) return null;
    return (
      <div className="mb-6">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 border-b border-stone-100 pb-1">{title}</h4>
        <div className="space-y-1">
          {groupEntries.map((entry, index) => renderEntryItem(entry, index))}
        </div>
      </div>
    );
  };

  const currentEntries = activeTab === 'daily' ? dailyEntries : activeTab === 'contract' ? contractEntries : activeTab === 'container' ? containerEntries : billingEntries;

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center sm:p-8">
      <div className="w-full min-h-screen sm:min-h-0 sm:h-[768px] sm:w-[380px] sm:flex-none bg-white font-sans flex flex-col relative overflow-hidden sm:mx-auto sm:border-[12px] border-stone-950 sm:rounded-[48px] sm:shadow-2xl">
        
        {/* App Header & Date Navigator */}
      <header className="bg-white px-6 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex flex-col">
          <div className="flex justify-between items-end mb-6">
            <div className="flex flex-col">
              <p className="text-[10px] font-black uppercase text-stone-400">
                {format(currentDate, 'EEEE')}
              </p>
              <h2 className="text-5xl font-black tracking-tighter text-stone-900">
                {format(currentDate, 'MMM d')}
              </h2>
            </div>
            <div className="w-12 h-12 bg-black rounded-full flex flex-col items-center justify-center -mr-2">
              <span className="text-[10px] font-black uppercase text-white leading-none mt-1">{entries.length}</span>
              <span className="text-[8px] font-bold text-white opacity-50 uppercase leading-none mt-0.5">Logs</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-b-2 border-black pb-2 mt-2">
            <div className="flex items-center gap-4">
              <button 
                onClick={handlePrevDay}
                className="text-stone-400 hover:text-black transition-colors active:scale-95"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              <button 
                onClick={handleToday}
                className="text-xs font-bold uppercase tracking-wider italic text-stone-900 hover:text-stone-500 transition-colors"
              >
                Daily Operations
              </button>
              <button 
                 onClick={handleNextDay}
                 className="text-stone-400 hover:text-black transition-colors active:scale-95"
              >
                <ChevronRight size={20} strokeWidth={3} />
              </button>
            </div>
            <p className="text-[10px] font-mono font-bold uppercase opacity-50">Filter By Time</p>
          </div>
        </div>
      </header>

      {/* Main Content / List */}
      <main className="flex-1 overflow-y-auto px-6 py-4 pb-32">
        {currentEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-stone-300">
            <Briefcase size={48} className="mb-3 opacity-20" strokeWidth={3} />
            <p className="text-xs font-black uppercase tracking-widest text-stone-400">No Operations</p>
            <p className="text-[10px] font-mono font-bold mt-1 text-stone-400">Tap + to add a record.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="border-b-2 border-stone-200 pb-2 mb-3 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                  {activeTab === 'daily' ? 'Daily Operations' : activeTab === 'contract' ? 'Contract Operations' : activeTab === 'container' ? 'Container / Repair' : 'Billing'}
                </h3>
                <span className="text-[10px] font-mono font-bold opacity-50">{currentEntries.length} Items</span>
              </div>
              <div className="space-y-1">
                {activeTab === 'daily' ? (
                  <>
                    {renderEntryGroup(currentEntries.filter(e => e.timeIn && e.timeOut), 'With Time In & Out')}
                    {renderEntryGroup(currentEntries.filter(e => e.timeIn && !e.timeOut), 'With Time In Only')}
                    {renderEntryGroup(currentEntries.filter(e => !e.timeIn && !e.timeOut), 'No Time In/Out')}
                  </>
                ) : (
                  currentEntries.map((entry, index) => renderEntryItem(entry, index))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav (Decorative / Actionable) */}
      <div className="px-6 py-4 bg-white flex justify-between items-center border-t border-stone-100 absolute bottom-0 left-0 right-0 z-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div 
          onClick={() => setActiveTab('daily')}
          className={cn("text-[10px] font-black uppercase cursor-pointer transition-all", activeTab === 'daily' ? "underline text-stone-900" : "opacity-30 hover:opacity-50")}
        >
          Daily
        </div>
        <div 
          onClick={() => setActiveTab('contract')}
          className={cn("text-[10px] font-black uppercase cursor-pointer transition-all", activeTab === 'contract' ? "underline text-stone-900" : "opacity-30 hover:opacity-50")}
        >
          Contract
        </div>
        <div 
          onClick={() => setActiveTab('container')}
          className={cn("text-[10px] font-black uppercase cursor-pointer transition-all", activeTab === 'container' ? "underline text-stone-900" : "opacity-30 hover:opacity-50")}
        >
          Container
        </div>
        <div 
          onClick={() => setActiveTab('billing')}
          className={cn("text-[10px] font-black uppercase cursor-pointer transition-all", activeTab === 'billing' ? "underline text-stone-900" : "opacity-30 hover:opacity-50")}
        >
          Billing
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="absolute bottom-20 right-6 z-10 pointer-events-none">
        <div className="flex justify-end pointer-events-auto">
          <button 
            onClick={openNewEntry}
            className="w-14 h-14 flex items-center justify-center bg-black hover:bg-stone-800 active:bg-stone-900 text-white rounded-full shadow-2xl transition-all active:scale-95"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Modals/Forms */}
        <EntryForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editingEntry}
          selectedDate={dateStr}
          onSave={handleSaveEntry}
          onDelete={deleteEntry}
        />

      </div>
    </div>
  );
}
