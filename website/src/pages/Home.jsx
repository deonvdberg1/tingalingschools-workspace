import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Heart, Star, Users, BookOpen, ChevronRight } from 'lucide-react';

const schools = [
  {
    key: 'PrePrimary',
    name: 'Pre-Primary School',
    tagline: 'Where little minds begin to blossom',
    address: '74 Krewilkring, Meerensee',
    description: 'Our Pre-Primary school provides a nurturing, play-based learning environment for children aged 2–6. We focus on building confidence, creativity, and school readiness in a warm and caring space.',
    highlights: ['Ages 2–6 years', 'Play-based learning', 'School readiness programme', 'Qualified educators'],
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
    description: 'Our Special Needs school offers individualized care and education for children with diverse learning needs. Our dedicated team of specialists creates personalized programmes in a supportive environment.',
    highlights: ['Individualised programmes', 'Specialist educators', 'Therapy support', 'Inclusive environment'],
    color: 'from-purple-500 to-pink-600',
    lightColor: 'from-purple-50 to-pink-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800',
    image: 'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=600&q=80',
  }
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-teal-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="flex justify-center mb-6">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696a07baa661a7bdc51582ff/3e0084bba_35b41dbf-1767-4649-8e3b-2b1df0f996ed.jpeg"
              alt="Ting-A-Ling School"
              className="w-20 h-20 rounded-full border-4 border-white/30 shadow-xl"
            />
          </div>
          <h1 className="text-5xl font-bold mb-4">Ting-A-Ling Schools</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Two dedicated schools in Meerensee, providing quality education and care for every child — from early childhood through to specialised learning support.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="#schools">
              <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white gap-2">
                Explore Our Schools <ChevronRight className="w-4 h-4" />
              </Button>
            </a>
            <Link to={createPageUrl('ParentContract')}>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                Enrol Your Child
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { Icon: Users, label: 'Happy Families', value: '200+' },
            { Icon: Heart, label: 'Years of Care', value: '15+' },
            { Icon: Star, label: 'Qualified Staff', value: '20+' },
            { Icon: BookOpen, label: 'Programmes', value: '8+' },
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
      <section id="schools" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Our Schools</h2>
          <p className="text-slate-500 text-lg">Choose the right fit for your child</p>
        </div>
        <div className="grid md:grid-cols-2 gap-10">
          {schools.map((school) => (
            <div key={school.key} className={`rounded-2xl border-2 ${school.border} bg-gradient-to-br ${school.lightColor} overflow-hidden shadow-sm hover:shadow-lg transition-shadow`}>
              <div className="h-52 overflow-hidden">
                <img src={school.image} alt={school.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-1">{school.name}</h3>
                <p className="text-slate-500 italic mb-4">{school.tagline}</p>
                <p className="text-slate-600 mb-5">{school.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {school.highlights.map(h => (
                    <span key={h} className={`text-xs font-medium px-3 py-1 rounded-full ${school.badge}`}>{h}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                  <MapPin className="w-4 h-4" /> {school.address}
                </div>
                <Link to={`${createPageUrl('ParentContract')}?school=${school.key}`}>
                  <Button className={`w-full bg-gradient-to-r ${school.color} text-white hover:opacity-90`}>
                    Enrol at {school.name}
                  </Button>
                </Link>
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
              <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-teal-400" /> Contact the school office</div>
              <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-teal-400" /> info@tingaling.co.za</div>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <h3 className="text-lg font-semibold text-slate-300">Quick Links</h3>
            <Link to={createPageUrl('ParentContract')}>
              <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start gap-2">
                <BookOpen className="w-4 h-4" /> Start Enrolment Form
              </Button>
            </Link>
            <Link to={createPageUrl('MyContracts')}>
              <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 justify-start gap-2">
                <Users className="w-4 h-4" /> My Child's Contracts
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}