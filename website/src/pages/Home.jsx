import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Heart, Star, Users, BookOpen, ChevronRight, Send, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const schools = [
  {
    key: 'PrePrimary',
    name: 'Pre-Primary School',
    tagline: 'Where little minds begin to blossom',
    address: '74 Krewilkring, Meerensee',
    description: 'Our Pre-Primary school provides a nurturing, play-based learning environment for children aged 2–6. We focus on building confidence, creativity, and school readiness in a warm and caring space. English language nurturing is integrated into our daily programme to ensure every child builds strong communication skills.',
    highlights: ['Ages 2–6 years', 'Play-based learning', 'English nurturing', 'School readiness programme'],
    color: 'from-teal-500 to-cyan-600',
    lightColor: 'from-teal-50 to-cyan-50',
    border: 'border-teal-200',
    badge: 'bg-teal-100 text-teal-800',
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80',
  },
  {
    key: 'SpecialNeeds',
    name: 'Special Needs School',
    tagline: 'Every child deserves to shine',
    address: '18 Elweboog, Meerensee',
    description: 'Our Special Needs school offers individualized care and education for children with diverse learning needs. Our dedicated team of specialists creates personalized programmes in a supportive environment. English nurturing is woven into our curriculum to support language development for every child.',
    highlights: ['Individualised programmes', 'English nurturing', 'Therapy support', 'Inclusive environment'],
    color: 'from-purple-500 to-pink-600',
    lightColor: 'from-purple-50 to-pink-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800',
    image: 'https://images.pexels.com/photos/8613089/pexels-photo-8613089.jpeg?auto=compress&cs=tinysrgb&w=600',
  }
];

export default function Home() {
  const [cf, setCf] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const submitContact = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      // Fire analytics event — contact form submitted
      if (window.AETrack) window.AETrack('contact-submit', cf.subject || 'Contact form');
      // Open the visitor's email app with a pre-filled message (no backend needed)
      const subject = encodeURIComponent(`Website enquiry: ${cf.subject}`);
      const body = encodeURIComponent(`Name: ${cf.name}\nEmail: ${cf.email}\nPhone: ${cf.phone || '—'}\n\n${cf.message}`);
      window.open(`mailto:info@tingalingschools.com?subject=${subject}&body=${body}`, '_self');
      toast.success('Thank you! Your message is ready in your email app — just press send.');
      setCf({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      if (window.AETrack) window.AETrack('contact-error', cf.subject || 'Contact form');
      toast.error('Could not send message. Please email us directly at info@tingalingschools.com');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-teal-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-14 text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="Ting-A-Ling School"
              className="w-24 h-24 rounded-full border-4 border-white/30 shadow-xl object-cover"
            />
          </div>
          <div className="relative mb-4">
            {/* Pre-Primary Background Banner - Left side */}
            <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 bg-gradient-to-b from-teal-500/15 to-cyan-600/15 text-teal-300/25 px-6 py-12 rounded-r-2xl -rotate-6">
              <span className="text-3xl font-black uppercase tracking-[0.2em]">Pre-Primary</span>
            </div>
            {/* Special Needs Background Banner - Right side */}
            <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 bg-gradient-to-b from-purple-500/15 to-pink-600/15 text-purple-300/25 px-6 py-12 rounded-l-2xl rotate-6">
              <span className="text-3xl font-black uppercase tracking-[0.2em]">Special Needs</span>
            </div>
            <h1 className="text-5xl font-bold relative z-10">Ting-A-Ling Schools</h1>
          </div>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Two dedicated schools in Richards Bay, Meerensee, providing quality education, English nurturing, and specialised care for every child.
          </p>
          <div className="flex flex-col items-center gap-4">
            <a href="#schools" className="block w-[280px]">
              <div className="bg-gradient-to-b from-teal-500 to-cyan-600 hover:opacity-90 rounded-xl px-5 py-3 text-center transition-opacity">
                <span className="flex items-center justify-center gap-2 text-white text-sm font-semibold">
                  <ChevronRight className="w-4 h-4" /> Explore Our Schools
                </span>
              </div>
            </a>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 w-[280px]">
              <h3 className="text-base font-bold text-white mb-3 text-center">Apply Now</h3>
              <div className="flex flex-col gap-2">
                <Link to={createPageUrl('Apply') + '?school=PrePrimary'}>
                  <div className="bg-gradient-to-b from-teal-500 to-cyan-600 hover:opacity-90 text-white px-5 py-3 rounded-lg text-sm font-semibold transition-opacity cursor-pointer text-center">
                    Pre-Primary School
                  </div>
                </Link>
                <Link to={createPageUrl('Apply') + '?school=SpecialNeeds'}>
                  <div className="bg-gradient-to-b from-purple-500 to-pink-600 hover:opacity-90 text-white px-5 py-3 rounded-lg text-sm font-semibold transition-opacity cursor-pointer text-center">
                    Special Needs School
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { Icon: Users, label: 'Happy Families', value: '200+' },
            { Icon: Heart, label: 'Years of Care', value: '15+' },
            { Icon: Star, label: 'English Nurturing', value: 'All Classes' },
            { Icon: BookOpen, label: 'Learning Support', value: '2 Schools' },
          ].map(({ Icon, label, value }) => (
            <div key={label}>
              <Icon className="w-6 h-6 text-teal-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-slate-800">{value}</div>
              <div className="text-sm text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Schools */}
      <section id="schools" className="max-w-5xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Our Schools</h2>
          <p className="text-slate-500 text-lg">Choose the right fit for your child</p>
        </div>
        <div className="grid md:grid-cols-2 gap-10">
          {schools.map((school) => (
            <div key={school.key} className={`rounded-2xl border-2 ${school.border} bg-gradient-to-br ${school.lightColor} overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col`}>
              <div className="h-48 overflow-hidden">
                <img src={school.image} alt={school.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-slate-800 mb-1">{school.name}</h3>
                <p className="text-slate-500 italic text-sm mb-3">{school.tagline}</p>
                <p className="text-slate-600 text-sm mb-4 flex-1">{school.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {school.highlights.map(h => (
                    <span key={h} className={`text-xs font-medium px-3 py-1 rounded-full ${school.badge}`}>{h}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
                  <MapPin className="w-3 h-3" /> {school.address}
                </div>
                <div className="flex flex-col gap-2">
                  <Link to={createPageUrl(school.key)}>
                    <Button className={`w-full bg-gradient-to-r ${school.color} text-white hover:opacity-90 text-sm`} variant="outline">
                      <ExternalLink className="w-3 h-3 mr-1" /> View School
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Apply') + '?school=' + school.key}>
                    <Button className={`w-full bg-gradient-to-r ${school.color} text-white hover:opacity-90 text-sm`}>
                      Apply to {school.name}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="bg-slate-800 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
            <p className="text-slate-400 mb-6">Have questions? We'd love to hear from you. Reach out to either of our schools directly.</p>
            <div className="space-y-3 text-slate-300">
              <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-teal-400 shrink-0" /> 74 Krewilkring, Meerensee (Pre-Primary)</div>
              <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-purple-400 shrink-0" /> 18 Elweboog, Meerensee (Special Needs)</div>
              <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-teal-400" /> <a href="tel:0615274429" onClick={() => window.AETrack && window.AETrack('contact-call', 'PrePrimary')} className="hover:text-teal-300">061 527 4429</a> / <a href="tel:0724561281" onClick={() => window.AETrack && window.AETrack('contact-call', 'SpecialNeeds')} className="hover:text-teal-300">072 456 1281</a></div>
              <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-teal-400" /> <a href="mailto:info@tingalingschools.com" onClick={() => window.AETrack && window.AETrack('contact-email', 'info@tingalingschools.com')} className="hover:text-teal-300">info@tingalingschools.com</a></div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Send Us a Message</h3>
            <form onSubmit={submitContact} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300">Name *</Label>
                  <Input value={cf.name} onChange={e => setCf(p => ({...p, name: e.target.value}))} required className="bg-slate-700 border-slate-600 text-white" placeholder="Your name" />
                </div>
                <div>
                  <Label className="text-slate-300">Email *</Label>
                  <Input type="email" value={cf.email} onChange={e => setCf(p => ({...p, email: e.target.value}))} required className="bg-slate-700 border-slate-600 text-white" placeholder="your@email.com" />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Phone (optional)</Label>
                <Input value={cf.phone} onChange={e => setCf(p => ({...p, phone: e.target.value}))} className="bg-slate-700 border-slate-600 text-white" placeholder="+27 82 123 4567" />
              </div>
              <div>
                <Label className="text-slate-300">Subject *</Label>
                <Input value={cf.subject} onChange={e => setCf(p => ({...p, subject: e.target.value}))} required className="bg-slate-700 border-slate-600 text-white" placeholder="How can we help?" />
              </div>
              <div>
                <Label className="text-slate-300">Message *</Label>
                <Textarea value={cf.message} onChange={e => setCf(p => ({...p, message: e.target.value}))} required className="bg-slate-700 border-slate-600 text-white min-h-[100px]" placeholder="Your message..." />
              </div>
              <Button type="submit" disabled={sending} className="w-full bg-teal-600 hover:bg-teal-500 gap-2">
                <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
