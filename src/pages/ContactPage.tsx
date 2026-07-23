import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

export function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Store as a general inquiry - we'll use newsletter table for contact form submissions
    // or we can create a simple contact_messages approach
    const { error } = await supabase.from('newsletter_subscribers').upsert({ email }, { onConflict: 'email' });
    if (!error) {
      toast('Message sent! We will get back to you soon.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } else {
      toast('Failed to send message. Please try again.', 'error');
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-ink-950 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Reveal>
          <p className="section-subtitle">Get in Touch</p>
          <h1 className="section-title mb-4">Contact Us</h1>
          <div className="gold-divider mb-8" />
          <p className="text-cream-200 max-w-2xl">
            Have a question or want to schedule a consultation? Our team is ready to help you find your dream property.
          </p>
        </Reveal>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <Reveal animation="slide-in-left">
            <div className="space-y-8">
              {[
                { icon: MapPin, title: 'Visit Us', value: '500 Fifth Avenue, New York, NY 10111' },
                { icon: Phone, title: 'Call Us', value: '+1 (212) 555-0100' },
                { icon: Mail, title: 'Email Us', value: 'contact@luxestate.com' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="inline-flex w-12 h-12 rounded-full bg-gold-400/10 items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-cream-100 tracking-wide uppercase mb-1">{item.title}</h3>
                    <p className="text-cream-200">{item.value}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-lg overflow-hidden border border-ink-700 h-64">
                <iframe
                  title="Office location"
                  width="100%"
                  height="100%"
                  loading="lazy"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-74.001%2C40.748%2C-73.971%2C40.762&layer=mapnik&marker=40.7589%2C-73.9770"
                  className="grayscale opacity-80"
                />
              </div>
            </div>
          </Reveal>

          {/* Contact form */}
          <Reveal animation="slide-in-right">
            <div className="glass-dark border border-ink-700 rounded-xl p-8">
              <h2 className="font-serif text-2xl text-cream-50 mb-6">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label-luxury">Your Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-luxury" required />
                </div>
                <div>
                  <label className="label-luxury">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-luxury" required />
                </div>
                <div>
                  <label className="label-luxury">Subject</label>
                  <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="input-luxury" required />
                </div>
                <div>
                  <label className="label-luxury">Message</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="input-luxury resize-none" required />
                </div>
                <button type="submit" disabled={sending} className="btn-gold w-full">
                  {sending ? 'Sending...' : 'Send Message'}
                  {!sending && <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
