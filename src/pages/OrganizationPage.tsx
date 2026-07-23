import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Mail, Shield, User as UserIcon, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { TeamMember, UserRole } from '@/types';
import { formatDate } from '@/lib/format';
import { Reveal } from '@/components/Reveal';
import { Modal } from '@/components/Modal';

export function OrganizationPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  // Invite form
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('agent');
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    const { data } = await supabase.from('team_members').select('*').order('created_at', { ascending: false });
    setMembers((data as TeamMember[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.role !== 'admin') return;
    fetchMembers();
  }, [profile]);

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-ink-950 pt-24 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-ink-600 mx-auto mb-4" />
          <p className="text-cream-200 text-lg mb-2">Admin access required</p>
          <p className="text-ink-500 text-sm">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const { error } = await supabase.from('team_members').insert({
        email, role, full_name: fullName, status: 'pending',
      });
      if (error) {
        if (error.code === '23505') {
          toast('This email has already been invited', 'error');
        } else {
          toast(error.message, 'error');
        }
      } else {
        toast(`Invitation sent to ${email}. They will become ${role} when they sign up.`);
        setShowInvite(false);
        setEmail('');
        setFullName('');
        setRole('agent');
        fetchMembers();
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to invite member', 'error');
    }
    setInviting(false);
  };

  const handleUpdateRole = async (id: string, newRole: UserRole) => {
    const { error } = await supabase.from('team_members').update({ role: newRole }).eq('id', id);
    if (error) {
      toast('Failed to update role', 'error');
    } else {
      toast('Role updated');
      fetchMembers();
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this team member?')) return;
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (error) {
      toast('Failed to remove member', 'error');
    } else {
      toast('Team member removed');
      fetchMembers();
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Reveal>
          <p className="section-subtitle">Team Management</p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="section-title mb-4">Organization</h1>
              <div className="gold-divider" />
            </div>
            <button onClick={() => setShowInvite(true)} className="btn-gold">
              <Plus className="w-4 h-4" />
              Invite Member
            </button>
          </div>
        </Reveal>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Members', value: members.length, icon: Users },
            { label: 'Active', value: members.filter((m) => m.status === 'active').length, icon: Shield },
            { label: 'Pending Invitations', value: members.filter((m) => m.status === 'pending').length, icon: Mail },
          ].map((stat) => (
            <div key={stat.label} className="glass-dark border border-ink-700 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="inline-flex w-12 h-12 rounded-full bg-gold-400/10 items-center justify-center">
                  <stat.icon className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <p className="font-serif text-3xl text-cream-50">{stat.value}</p>
                  <p className="text-sm text-ink-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Members table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-ink-600 mx-auto mb-4" />
            <p className="text-cream-200 text-lg mb-2">No team members yet</p>
            <p className="text-ink-500 text-sm mb-6">Invite agents or admins to join your team.</p>
            <button onClick={() => setShowInvite(true)} className="btn-gold">
              <Plus className="w-4 h-4" />
              Invite Member
            </button>
          </div>
        ) : (
          <div className="glass-dark border border-ink-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-700">
                    <th className="text-left px-6 py-4 text-xs font-medium text-ink-500 tracking-wide uppercase">Member</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-ink-500 tracking-wide uppercase">Role</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-ink-500 tracking-wide uppercase">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-ink-500 tracking-wide uppercase">Invited</th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-ink-500 tracking-wide uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-ink-800 hover:bg-ink-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gold-400/10 flex items-center justify-center text-gold-400 font-semibold">
                            {member.full_name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-cream-100 font-medium">{member.full_name || 'Pending'}</p>
                            <p className="text-xs text-ink-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value as UserRole)}
                          className="bg-ink-800 border border-ink-600 text-cream-100 rounded-sm px-3 py-1.5 text-sm outline-none focus:border-gold-400"
                        >
                          <option value="agent">Agent</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs rounded-sm ${
                          member.status === 'active' ? 'bg-green-400/20 text-green-300' : 'bg-gold-400/20 text-gold-300'
                        }`}>
                          {member.status === 'active' ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-500">{formatDate(member.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="w-9 h-9 rounded-full hover:bg-red-500/10 text-red-400 inline-flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info box */}
        <div className="mt-8 glass-dark border border-gold-400/20 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-cream-100 font-medium mb-1">How invitations work</p>
              <p className="text-sm text-ink-500 leading-relaxed">
                When you invite a team member, they receive the role you assign. When they sign up with the invited email, they automatically get that role. Pending members have not yet signed up. You can change roles or remove members at any time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <Modal open onClose={() => setShowInvite(false)} title="Invite Team Member" size="md">
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="label-luxury">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-luxury" placeholder="John Doe" required />
            </div>
            <div>
              <label className="label-luxury">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-luxury" placeholder="agent@example.com" required />
            </div>
            <div>
              <label className="label-luxury">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="input-luxury">
                <option value="agent">Agent — Can manage properties and view inquiries</option>
                <option value="admin">Admin — Full access including team management</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4 border-t border-ink-700">
              <button type="submit" disabled={inviting} className="btn-gold flex-1">
                {inviting ? 'Sending...' : 'Send Invitation'}
              </button>
              <button type="button" onClick={() => setShowInvite(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
