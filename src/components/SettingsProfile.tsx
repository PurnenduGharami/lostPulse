import { useState, useMemo } from 'react';
import type { UserProfile } from '../types';
import LiquidSelect from './LiquidSelect';
import LiquidNumberInput from './LiquidNumberInput';
import CustomDatePicker from './CustomDatePicker';

interface SettingsProfileProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  goals: Record<string, string>;
  onSaveGoal: (key: string, value: string) => Promise<void>;
}

export default function SettingsProfile({ userProfile, onUpdateProfile, goals, onSaveGoal }: SettingsProfileProps) {
  const [profile, setProfile] = useState<UserProfile>(userProfile);

  const handleSave = () => {
    onUpdateProfile(profile);
  };

  const { age, lifeRemaining, daysLived, daysRemaining } = useMemo(() => {
    if (!profile.birthDate) return { age: 0, lifeRemaining: 0, daysLived: 0, daysRemaining: 0 };
    
    const [y, m, d] = profile.birthDate.split('-').map(Number);
    const birthMs = new Date(y, m - 1, d).getTime();
    const nowMs = Date.now();
    const msLived = nowMs - birthMs;
    const daysLived = Math.floor(msLived / (1000 * 60 * 60 * 24));
    const age = msLived / (1000 * 60 * 60 * 24 * 365.25);
    
    const targetAge = profile.targetLifespan || 80;
    const lifeRemaining = Math.max(targetAge - age, 0);
    const targetMs = targetAge * 365.25 * 24 * 60 * 60 * 1000;
    const msRemaining = Math.max((birthMs + targetMs) - nowMs, 0);
    const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24));

    return { 
      age: age.toFixed(1), 
      lifeRemaining: lifeRemaining.toFixed(1), 
      daysLived: daysLived.toLocaleString(), 
      daysRemaining: daysRemaining.toLocaleString() 
    };
  }, [profile.birthDate, profile.targetLifespan]);

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="mb-8 border-b border-[#333] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-cinzel text-xl sm:text-2xl text-white tracking-widest uppercase mb-2">Profile Configuration</h2>
          <p className="font-mono text-xs text-[#888] uppercase tracking-widest">
            Manage your personal parameters and life metrics.
          </p>
        </div>
        <button 
          onClick={handleSave}
          className="w-full sm:w-auto px-6 py-2 bg-white/10 hover:bg-white text-white hover:text-black font-mono text-xs uppercase tracking-widest transition-colors rounded-sm border border-white/20 hover:border-white min-h-[44px]"
        >
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Yearly Goal Section */}
          <section className="liquid-panel p-6 rounded-md border border-[#222]">
            <h3 className="font-mono text-sm text-white uppercase tracking-widest mb-6 border-b border-[#333] pb-2">Year Goal</h3>
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs text-[#888] uppercase">What is your main focus for {new Date().getFullYear()}?</label>
              <textarea 
                value={goals[`yearly-${new Date().getFullYear()}`] || ''}
                onChange={(e) => onSaveGoal(`yearly-${new Date().getFullYear()}`, e.target.value)}
                rows={3}
                placeholder="Enter your overarching goal for this year..."
                className="w-full bg-[#111] border border-[#333] rounded-sm p-3 font-mono text-sm text-white focus:outline-none focus:border-[#666] transition-colors resize-none"
              />
            </div>
          </section>

          {/* Preferences Section */}
          <section className="liquid-panel p-6 rounded-md border border-[#222]">
            <h3 className="font-mono text-sm text-white uppercase tracking-widest mb-6 border-b border-[#333] pb-2">Identity</h3>
            
            <div className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs text-[#888] uppercase">Full Name</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-[#111] border border-[#333] rounded-sm p-3 font-mono text-sm text-white focus:outline-none focus:border-[#666] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-xs text-[#888] uppercase">Date of Birth</label>
                  <CustomDatePicker 
                    currentDate={profile.birthDate} 
                    onChange={(d) => setProfile({...profile, birthDate: d})} 
                    maxDate={new Date().toISOString().split('T')[0]} 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-xs text-[#888] uppercase">Gender (Optional)</label>
                  <LiquidSelect 
                    value={profile.gender || 'unspecified'}
                    onChange={(v) => setProfile({...profile, gender: v === 'unspecified' ? undefined : v as string})}
                    options={[
                      { value: 'unspecified', label: 'Unspecified' },
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'other', label: 'Other' }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-xs text-[#888] uppercase">Country</label>
                  <input 
                    type="text" 
                    value={profile.country || ''}
                    placeholder="e.g. United States"
                    onChange={(e) => setProfile({...profile, country: e.target.value})}
                    className="w-full bg-[#111] border border-[#333] rounded-sm p-3 font-mono text-sm text-white focus:outline-none focus:border-[#666] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-xs text-[#888] uppercase">Timezone</label>
                  <input 
                    type="text" 
                    value={profile.timezone || ''}
                    placeholder="e.g. EST"
                    onChange={(e) => setProfile({...profile, timezone: e.target.value})}
                    className="w-full bg-[#111] border border-[#333] rounded-sm p-3 font-mono text-sm text-white focus:outline-none focus:border-[#666] transition-colors"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Biological Targets Section */}
          <section className="liquid-panel p-6 rounded-md border border-[#222]">
            <h3 className="font-mono text-sm text-white uppercase tracking-widest mb-6 border-b border-[#333] pb-2">Biological Targets</h3>
            
            <div className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs text-[#888] uppercase">Life Expectancy (Years)</label>
                <p className="font-mono text-[10px] text-[#555] mb-2 leading-tight">
                  This determines your life progress and countdown metrics. 
                </p>
                <div className="w-32">
                  <LiquidNumberInput 
                    value={profile.targetLifespan}
                    onChange={(v) => setProfile({...profile, targetLifespan: Number(v)})}
                    min={20}
                    max={120}
                    step={1}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs text-[#888] uppercase">Daily Sleep Target (Hours)</label>
                <p className="font-mono text-[10px] text-[#555] mb-2 leading-tight">
                  Used by the planner to enforce boundaries on your available active hours.
                </p>
                <div className="w-32">
                  <LiquidNumberInput 
                    value={profile.sleepTarget || 8}
                    onChange={(v) => setProfile({...profile, sleepTarget: Number(v)})}
                    min={4}
                    max={12}
                    step={0.5}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-xs text-[#888] uppercase">Pref Start of Day</label>
                  <input 
                    type="text" 
                    value={profile.preferredStartOfDay || '08:00'}
                    placeholder="08:00"
                    onChange={(e) => setProfile({...profile, preferredStartOfDay: e.target.value})}
                    className="w-full bg-[#111] border border-[#333] rounded-sm p-3 font-mono text-sm text-white focus:outline-none focus:border-[#666] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-xs text-[#888] uppercase">Pref End of Day</label>
                  <input 
                    type="text" 
                    value={profile.preferredEndOfDay || '22:00'}
                    placeholder="22:00"
                    onChange={(e) => setProfile({...profile, preferredEndOfDay: e.target.value})}
                    className="w-full bg-[#111] border border-[#333] rounded-sm p-3 font-mono text-sm text-white focus:outline-none focus:border-[#666] transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs text-[#888] uppercase">Time Format</label>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-xs uppercase tracking-widest transition-colors ${!profile.use24HourFormat ? 'text-white' : 'text-[#555]'}`}>12H AM/PM</span>
                  <button 
                    onClick={() => setProfile({...profile, use24HourFormat: !profile.use24HourFormat})}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${profile.use24HourFormat ? 'bg-red-500' : 'bg-[#333]'}`}
                  >
                    <span 
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${profile.use24HourFormat ? 'translate-x-6' : 'translate-x-0'}`}
                    />
                  </button>
                  <span className={`font-mono text-xs uppercase tracking-widest transition-colors ${profile.use24HourFormat ? 'text-white' : 'text-[#555]'}`}>24H (Military)</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Derived Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="liquid-panel p-6 rounded-md border border-[#222]">
            <h3 className="font-mono text-sm text-white uppercase tracking-widest mb-6 border-b border-[#333] pb-2">Derived Metrics</h3>
            
            <ul className="space-y-6">
              <li className="flex flex-col">
                <span className="font-mono text-[10px] text-[#888] uppercase tracking-widest">Current Age</span>
                <span className="font-mono text-2xl text-white">{age} <span className="text-sm text-[#666]">YRS</span></span>
              </li>
              <li className="flex flex-col">
                <span className="font-mono text-[10px] text-[#888] uppercase tracking-widest">Estimated Life Remaining</span>
                <span className="font-mono text-2xl text-emerald-500">{lifeRemaining} <span className="text-sm text-[#666]">YRS</span></span>
              </li>
              <li className="flex flex-col pt-4 border-t border-[#222]">
                <span className="font-mono text-[10px] text-[#888] uppercase tracking-widest">Days Lived</span>
                <span className="font-mono text-xl text-white">{daysLived}</span>
              </li>
              <li className="flex flex-col">
                <span className="font-mono text-[10px] text-[#888] uppercase tracking-widest">Days Remaining</span>
                <span className="font-mono text-xl text-emerald-500">{daysRemaining}</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
