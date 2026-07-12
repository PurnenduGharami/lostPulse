import { useState } from 'react';
import type { UserProfile, LifeGoal } from '../types';
import { v4 as uuidv4 } from 'uuid';
import LiquidSelect from './LiquidSelect';
import CustomDatePicker from './CustomDatePicker';

interface SettingsGoalsProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

export default function SettingsGoals({ userProfile, onUpdateProfile }: SettingsGoalsProps) {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [valuesInput, setValuesInput] = useState((userProfile.values || []).join(', '));
  
  const [editingGoal, setEditingGoal] = useState<LifeGoal | null>(null);

  const handleSave = () => {
    onUpdateProfile({
      ...profile,
      values: valuesInput.split(',').map(v => v.trim()).filter(Boolean)
    });
  };

  const handleCreateGoal = () => {
    setEditingGoal({
      id: uuidv4(),
      type: 'long_term',
      name: '',
      description: '',
      priority: 'medium',
      status: 'not_started',
      color: '#ffffff'
    });
  };

  const handleSaveGoal = () => {
    if (!editingGoal || !editingGoal.name) return;
    const existing = profile.lifeGoals || [];
    const idx = existing.findIndex(g => g.id === editingGoal.id);
    let newGoals;
    if (idx >= 0) {
      newGoals = [...existing];
      newGoals[idx] = editingGoal;
    } else {
      newGoals = [...existing, editingGoal];
    }
    setProfile({ ...profile, lifeGoals: newGoals });
    setEditingGoal(null);
  };

  const handleDeleteGoal = (id: string) => {
    const newGoals = (profile.lifeGoals || []).filter(g => g.id !== id);
    setProfile({ ...profile, lifeGoals: newGoals });
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="mb-8 border-b border-[#333] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-cinzel text-xl sm:text-2xl text-white tracking-widest uppercase mb-2">Life Intentions</h2>
          <p className="font-mono text-xs text-[#888] uppercase tracking-widest">
            Establish your values and long term horizons.
          </p>
        </div>
        <button 
          onClick={handleSave}
          className="w-full sm:w-auto px-6 py-2 bg-white/10 hover:bg-white text-white hover:text-black font-mono text-xs uppercase tracking-widest transition-colors rounded-sm border border-white/20 hover:border-white min-h-[44px]"
        >
          Save Changes
        </button>
      </div>

      <div className="space-y-8">
        
        {/* Foundation Section */}
        <section className="liquid-panel p-6 rounded-md border border-[#222]">
          <h3 className="font-mono text-sm text-white uppercase tracking-widest mb-6 border-b border-[#333] pb-2">Foundation</h3>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs text-[#888] uppercase">Mission Statement</label>
              <textarea 
                value={profile.missionStatement || ''}
                onChange={(e) => setProfile({...profile, missionStatement: e.target.value})}
                placeholder="What is your ultimate purpose?"
                className="w-full bg-[#111] border border-[#333] rounded-sm p-3 font-mono text-sm text-white focus:outline-none focus:border-[#666] transition-colors resize-none h-24"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs text-[#888] uppercase">Personal Philosophy</label>
              <textarea 
                value={profile.philosophy || ''}
                onChange={(e) => setProfile({...profile, philosophy: e.target.value})}
                placeholder="How do you approach life? What rules do you live by?"
                className="w-full bg-[#111] border border-[#333] rounded-sm p-3 font-mono text-sm text-white focus:outline-none focus:border-[#666] transition-colors resize-none h-24"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs text-[#888] uppercase">Core Values (Comma Separated)</label>
              <input 
                type="text"
                value={valuesInput}
                onChange={(e) => setValuesInput(e.target.value)}
                placeholder="Integrity, Freedom, Mastery..."
                className="w-full bg-[#111] border border-[#333] rounded-sm p-3 font-mono text-sm text-white focus:outline-none focus:border-[#666] transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Goals List Section */}
        <section className="liquid-panel p-6 rounded-md border border-[#222]">
          <div className="flex justify-between items-center mb-6 border-b border-[#333] pb-2">
            <h3 className="font-mono text-sm text-white uppercase tracking-widest">Targets & Projects</h3>
            <button 
              onClick={handleCreateGoal}
              className="text-emerald-400 hover:text-emerald-300 font-mono text-xs uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Goal
            </button>
          </div>

          <div className="space-y-4">
            {(profile.lifeGoals || []).length === 0 ? (
              <div className="text-center py-8 text-[#555] font-mono text-xs uppercase tracking-widest">
                No goals defined yet.
              </div>
            ) : (
              (profile.lifeGoals || []).map(goal => (
                <div key={goal.id} className="bg-[#111] border border-[#333] rounded-sm p-4 flex justify-between items-start group">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: goal.color || '#fff' }} />
                      <h4 className="font-serif text-lg text-white">{goal.name}</h4>
                      <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-white/5 text-[#888] border border-white/10">
                        {goal.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-[#888] mb-2">{goal.description}</p>
                    <div className="flex gap-4 font-mono text-[10px] uppercase text-[#666]">
                      <span>Priority: {goal.priority}</span>
                      <span>Status: {goal.status.replace('_', ' ')}</span>
                      {goal.targetDate && <span>Target: {goal.targetDate}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingGoal(goal)} className="p-2 text-[#888] hover:text-white">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => handleDeleteGoal(goal.id)} className="p-2 text-[#888] hover:text-red-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Goal Editor Modal */}
      {editingGoal && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a0a0c] border border-[#333] rounded-md shadow-2xl p-6">
            <h3 className="font-cinzel text-xl text-white tracking-widest uppercase mb-6 border-b border-[#333] pb-2">
              {profile.lifeGoals?.find(g => g.id === editingGoal.id) ? 'Edit Goal' : 'New Goal'}
            </h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs text-[#888] uppercase">Name</label>
                <input 
                  type="text" value={editingGoal.name} 
                  onChange={e => setEditingGoal({...editingGoal, name: e.target.value})}
                  className="w-full bg-[#111] border border-[#333] rounded-sm p-2 font-mono text-sm text-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs text-[#888] uppercase">Description</label>
                <textarea 
                  value={editingGoal.description} 
                  onChange={e => setEditingGoal({...editingGoal, description: e.target.value})}
                  className="w-full bg-[#111] border border-[#333] rounded-sm p-2 font-mono text-sm text-white h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-xs text-[#888] uppercase">Type</label>
                  <LiquidSelect 
                    value={editingGoal.type}
                    onChange={(v) => setEditingGoal({...editingGoal, type: v as any})}
                    options={[
                      { value: 'long_term', label: 'Long Term' },
                      { value: 'priority', label: 'Life Priority' },
                      { value: 'dream_project', label: 'Dream Project' },
                      { value: 'bucket_list', label: 'Bucket List' }
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-xs text-[#888] uppercase">Priority</label>
                  <LiquidSelect 
                    value={editingGoal.priority}
                    onChange={(v) => setEditingGoal({...editingGoal, priority: v as any})}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'critical', label: 'Critical' }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-xs text-[#888] uppercase">Status</label>
                  <LiquidSelect 
                    value={editingGoal.status}
                    onChange={(v) => setEditingGoal({...editingGoal, status: v as any})}
                    options={[
                      { value: 'not_started', label: 'Not Started' },
                      { value: 'in_progress', label: 'In Progress' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'abandoned', label: 'Abandoned' }
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-xs text-[#888] uppercase">Target Date</label>
                  <CustomDatePicker 
                    currentDate={editingGoal.targetDate || ''}
                    onChange={(d) => setEditingGoal({...editingGoal, targetDate: d})}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs text-[#888] uppercase">Color</label>
                <div className="flex gap-2">
                  {['#ffffff', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map(c => (
                    <button 
                      key={c}
                      onClick={() => setEditingGoal({...editingGoal, color: c})}
                      className={`w-6 h-6 rounded-full border-2 ${editingGoal.color === c ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setEditingGoal(null)}
                className="px-4 py-2 text-[#888] hover:text-white font-mono text-xs uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveGoal}
                disabled={!editingGoal.name}
                className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs uppercase tracking-widest rounded-sm border border-emerald-500/50 transition-colors"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
