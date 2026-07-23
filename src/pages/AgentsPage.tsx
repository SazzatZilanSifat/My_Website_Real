import { useState, useEffect } from 'react';
import { Mail, Phone, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Reveal } from '@/components/Reveal';
import { Modal } from '@/components/Modal';
import { ImageUploader } from '@/components/ImageUploader';

export function AgentsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const isStaff = profile?.role === 'agent' || profile?.role === 'admin';

  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAgents = async () => {
    const { data } = await supabase.from('profiles').select('*').in('role', ['agent', 'admin']).order('created_at', { ascending: false });
    setAgents((data as Profile[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAgents(); }, []);

  const openForm = (agent: Profile | null) => {
    setEditingAgent(agent);
    setFullName(agent?.full_name ?? '');
    setEmail(agent?.email ?? '');
    setPhone(agent?.phone ?? '');
    setBio(agent?.bio ?? '');
    setAvatarUrl(agent?.avatar_url ?? '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingAgent) {
        const { error } = await supabase.from('profiles').update({
          full_name: fullName, phone, bio, avatar_url: avatarUrl,
        }).eq('id', editingAgent.id);
        if (error) throw error;
        toast('Agent updated');
      } else {
        // Create a team member invitation
        const { error } = await supabase.from('team_members').insert({
          email, role: 'agent', status: 'pending', full_name: fullName,
        });
        if (error) throw error;
        toast('Agent invitation created. They will appear here after signing up.');
      }
      setShowForm(false);
      fetchAgents();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save agent', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this agent? Their account will remain but they will lose agent privileges.')) return;
    const { error } = await supabase.from('profiles').update({ role: 'client' }).eq('id', id);
    if (error) {
      toast('Failed to remove agent', 'error');
    } else {
      toast('Agent removed');
      fetchAgents();
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Reveal>
          <p className="section-subtitle">Meet the Experts</p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="section-title mb-4">Our Agents</h1>
              <div className="gold-divider" />
            </div>
            {isStaff && (
              <button onClick={() => openForm(null)} className="btn-gold">
                <Plus className="w-4 h-4" />
                Add Agent
              </button>
            )}
          </div>
        </Reveal>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card-luxury h-80 animate-pulse">
                <div className="h-48 bg-ink-800" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-ink-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-ink-600 mx-auto mb-4" />
            <p className="text-cream-200 text-lg">No agents yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents.map((agent, i) => (
              <Reveal key={agent.id} delay={(i % 3) * 100}>
                <div className="card-luxury group text-center p-8 relative">
                  {isStaff && (
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openForm(agent)} className="w-9 h-9 rounded-full glass-dark flex items-center justify-center text-gold-400 hover:bg-gold-400 hover:text-ink-950 transition-all">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(agent.id)} className="w-9 h-9 rounded-full glass-dark flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="relative w-28 h-28 mx-auto mb-6">
                    {agent.avatar_url ? (
                      <img src={agent.avatar_url} alt={agent.full_name} className="w-28 h-28 rounded-full object-cover border-2 border-gold-400/30" />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-gold-400/10 border-2 border-gold-400/30 flex items-center justify-center text-gold-400 text-4xl font-serif font-semibold">
                        {agent.full_name?.[0]?.toUpperCase() || 'A'}
                      </div>
                    )}
                  </div>
                  <h3 className="font-serif text-xl text-cream-50 mb-1">{agent.full_name || 'Unnamed Agent'}</h3>
                  <p className="text-sm text-gold-400 capitalize mb-4">{agent.role}</p>
                  {agent.bio && <p className="text-sm text-ink-500 leading-relaxed mb-4">{agent.bio}</p>}
                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-ink-700">
                    <a href={`mailto:${agent.email}`} className="text-ink-500 hover:text-gold-400 transition-colors">
                      <Mail className="w-5 h-5" />
                    </a>
                    {agent.phone && (
                      <a href={`tel:${agent.phone}`} className="text-ink-500 hover:text-gold-400 transition-colors">
                        <Phone className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title={editingAgent ? 'Edit Agent' : 'Invite Agent'} size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-luxury">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-luxury" required />
            </div>
            {!editingAgent && (
              <div>
                <label className="label-luxury">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-luxury" required />
              </div>
            )}
            <div>
              <label className="label-luxury">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-luxury" />
            </div>
            <div>
              <label className="label-luxury">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="input-luxury resize-none" />
            </div>
            <div>
              <ImageUploader
                value={avatarUrl}
                onChange={setAvatarUrl}
                aspect={1}
                label="Avatar Photo"
                folder="agents"
              />
            </div>
            <div className="flex gap-3 pt-4 border-t border-ink-700">
              <button type="submit" disabled={saving} className="btn-gold flex-1">
                {saving ? 'Saving...' : editingAgent ? 'Update Agent' : 'Invite Agent'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
