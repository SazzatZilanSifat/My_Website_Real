import { useState, useEffect } from 'react';
import { Mail, Calendar, Check, X, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useHashRoute } from '@/lib/router';
import type { Inquiry, Tour, Property, InquiryStatus, TourStatus } from '@/types';
import { formatDateTime, statusLabel } from '@/lib/format';
import { Reveal } from '@/components/Reveal';

type Tab = 'inquiries' | 'tours';

export function InquiriesPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { navigate } = useHashRoute();
  const [tab, setTab] = useState<Tab>('inquiries');
  const [loading, setLoading] = useState(true);

  const [inquiries, setInquiries] = useState<(Inquiry & { property?: Property })[]>([]);
  const [tours, setTours] = useState<(Tour & { property?: Property })[]>([]);

  useEffect(() => {
    if (profile?.role !== 'agent' && profile?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    (async () => {
      const [inqRes, tourRes] = await Promise.all([
        supabase.from('inquiries').select('*, property:properties(*)').order('created_at', { ascending: false }),
        supabase.from('tours').select('*, property:properties(*)').order('created_at', { ascending: false }),
      ]);
      setInquiries((inqRes.data as (Inquiry & { property?: Property })[]) || []);
      setTours((tourRes.data as (Tour & { property?: Property })[]) || []);
      setLoading(false);
    })();
  }, [profile, navigate]);

  if (profile?.role !== 'agent' && profile?.role !== 'admin') return null;

  const updateInquiryStatus = async (id: string, status: InquiryStatus) => {
    const { error } = await supabase.from('inquiries').update({ status }).eq('id', id);
    if (error) {
      toast('Failed to update status', 'error');
    } else {
      toast('Status updated');
      setInquiries((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    }
  };

  const updateTourStatus = async (id: string, status: TourStatus) => {
    const { error } = await supabase.from('tours').update({ status }).eq('id', id);
    if (error) {
      toast('Failed to update status', 'error');
    } else {
      toast('Tour status updated');
      setTours((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Reveal>
          <p className="section-subtitle">Client Communications</p>
          <h1 className="section-title mb-4">Inquiries & Tours</h1>
          <div className="gold-divider" />
        </Reveal>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-ink-700 pb-px">
          {[
            { key: 'inquiries' as Tab, label: 'Inquiries', icon: Mail, count: inquiries.length },
            { key: 'tours' as Tab, label: 'Tours', icon: Calendar, count: tours.length },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium tracking-wide transition-all relative ${
                tab === t.key ? 'text-gold-400' : 'text-cream-200 hover:text-gold-300'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count > 0 && <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-ink-700 text-cream-200">{t.count}</span>}
              {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'inquiries' && (
              <div className="space-y-4">
                {inquiries.length === 0 ? (
                  <div className="text-center py-20">
                    <Mail className="w-16 h-16 text-ink-600 mx-auto mb-4" />
                    <p className="text-cream-200 text-lg">No inquiries yet</p>
                  </div>
                ) : (
                  inquiries.map((inq) => (
                    <div key={inq.id} className="glass-dark border border-ink-700 rounded-lg p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <button onClick={() => navigate(`/properties/${inq.property_id}`)} className="font-serif text-lg text-cream-50 hover:text-gold-300 transition-colors">
                            {inq.property?.title ?? 'Property'}
                          </button>
                          <p className="text-sm text-ink-500 mt-1">
                            From: {inq.name} ({inq.email}) {inq.phone && `• ${inq.phone}`}
                          </p>
                          <p className="text-xs text-ink-500 mt-1">{formatDateTime(inq.created_at)}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-sm whitespace-nowrap ${
                          inq.status === 'new' ? 'bg-gold-400/20 text-gold-300' :
                          inq.status === 'replied' ? 'bg-blue-400/20 text-blue-300' :
                          inq.status === 'closed' ? 'bg-ink-700 text-ink-500' :
                          'bg-ink-700 text-cream-200'
                        }`}>{statusLabel(inq.status)}</span>
                      </div>
                      <p className="text-cream-200 text-sm leading-relaxed mb-4 bg-ink-800/50 rounded-sm p-4">{inq.message}</p>
                      <div className="flex gap-2 flex-wrap">
                        {inq.status !== 'read' && (
                          <button onClick={() => updateInquiryStatus(inq.id, 'read')} className="btn-ghost text-xs">
                            <Check className="w-3.5 h-3.5" /> Mark Read
                          </button>
                        )}
                        {inq.status !== 'replied' && (
                          <button onClick={() => updateInquiryStatus(inq.id, 'replied')} className="btn-ghost text-xs">
                            <Mail className="w-3.5 h-3.5" /> Mark Replied
                          </button>
                        )}
                        {inq.status !== 'closed' && (
                          <button onClick={() => updateInquiryStatus(inq.id, 'closed')} className="btn-ghost text-xs text-red-400">
                            <X className="w-3.5 h-3.5" /> Close
                          </button>
                        )}
                        <a href={`mailto:${inq.email}`} className="btn-gold text-xs ml-auto">
                          <Mail className="w-3.5 h-3.5" /> Reply
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'tours' && (
              <div className="space-y-4">
                {tours.length === 0 ? (
                  <div className="text-center py-20">
                    <Calendar className="w-16 h-16 text-ink-600 mx-auto mb-4" />
                    <p className="text-cream-200 text-lg">No tours scheduled</p>
                  </div>
                ) : (
                  tours.map((tour) => (
                    <div key={tour.id} className="glass-dark border border-ink-700 rounded-lg p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <button onClick={() => navigate(`/properties/${tour.property_id}`)} className="font-serif text-lg text-cream-50 hover:text-gold-300 transition-colors">
                            {tour.property?.title ?? 'Property'}
                          </button>
                          <p className="text-sm text-ink-500 mt-1">
                            Client: {tour.name} ({tour.email}) {tour.phone && `• ${tour.phone}`}
                          </p>
                          <p className="text-sm text-gold-400 mt-1 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDateTime(tour.scheduled_at)}
                          </p>
                          {tour.notes && <p className="text-sm text-cream-200 mt-2">{tour.notes}</p>}
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-sm whitespace-nowrap ${
                          tour.status === 'pending' ? 'bg-gold-400/20 text-gold-300' :
                          tour.status === 'confirmed' ? 'bg-green-400/20 text-green-300' :
                          tour.status === 'cancelled' ? 'bg-red-400/20 text-red-300' :
                          'bg-ink-700 text-cream-200'
                        }`}>{statusLabel(tour.status)}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {tour.status === 'pending' && (
                          <button onClick={() => updateTourStatus(tour.id, 'confirmed')} className="btn-ghost text-xs text-green-400">
                            <Check className="w-3.5 h-3.5" /> Confirm
                          </button>
                        )}
                        {tour.status !== 'cancelled' && tour.status !== 'completed' && (
                          <button onClick={() => updateTourStatus(tour.id, 'cancelled')} className="btn-ghost text-xs text-red-400">
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                        )}
                        {tour.status === 'confirmed' && (
                          <button onClick={() => updateTourStatus(tour.id, 'completed')} className="btn-ghost text-xs">
                            <Check className="w-3.5 h-3.5" /> Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
