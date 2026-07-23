import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Heart, Users, Star, BookOpen, Smile, Palette, Music, Clock, Sun, CloudSun, MessageCircle, HelpCircle, ChevronDown, Camera, Clock4 } from 'lucide-react';

const highlights = [
  { Icon: Smile, title: 'Play-Based Learning', desc: 'We follow a play-based curriculum where children learn through discovery, exploration, and hands-on activities that spark natural curiosity.' },
  { Icon: Star, title: 'English Nurturing', desc: 'Integrated English language development in every activity — songs, stories, and conversation — so each child builds strong communication skills from day one.' },
  { Icon: Users, title: 'Small Classes', desc: 'Low learner-to-teacher ratios mean every child gets individual attention. No one slips through the cracks.' },
  { Icon: Heart, title: 'School Readiness', desc: 'Our Grade R programme prepares children for formal schooling with confidence, social skills, and a genuine love for learning.' },
];

const programmes = [
  { Icon: BookOpen, title: 'Early Literacy & Numeracy', desc: 'Foundational skills through stories, rhymes, counting games, and hands-on number activities that make learning feel like play.' },
  { Icon: Palette, title: 'Creative Arts', desc: 'Art, craft, music, and drama to encourage self-expression, creativity, and fine motor development in a fun, messy, wonderful way.' },
  { Icon: Music, title: 'Physical Development', desc: 'Gross motor activities, outdoor play on our playground, and movement exercises to build strength, coordination, and confidence.' },
  { Icon: Smile, title: 'Social & Emotional Learning', desc: 'Building friendships, learning to share, managing emotions, and developing positive social skills in a warm, caring environment.' },
];

const dailyRoutine = [
  { time: '07:30 – 08:00', activity: 'Drop-off & Free Play', desc: 'Arrival, settling in, and free choice activities' },
  { time: '08:00 – 08:30', activity: 'Morning Ring', desc: 'Greeting, weather chart, news of the day, songs' },
  { time: '08:30 – 09:15', activity: 'Literacy & Numeracy', desc: 'Structured learning through stories, games, and activities' },
  { time: '09:15 – 09:45', activity: 'Snack Time', desc: 'Healthy eating together — social skills at the table' },
  { time: '09:45 – 10:30', activity: 'Outdoor Play', desc: 'Gross motor development on our playground and garden' },
  { time: '10:30 – 11:15', activity: 'Creative Arts / Theme Work', desc: 'Art, craft, music, or themed projects' },
  { time: '11:15 – 11:45', activity: 'Free Play & Discovery', desc: 'Choice time — puzzles, books, imaginative play' },
  { time: '11:45 – 12:00', activity: 'Story Time & Dismissal', desc: 'Winding down with a story, then home time' },
  { time: '13:30 – 17:00', activity: 'After-Care Programme', desc: 'Supervised play, rest, and activities for working parents' },
];

const faqs = [
  { q: 'What ages do you accept?', a: 'We accept children from 3 years old up to 6 years (Grade R). Our programmes are tailored to each age group\'s developmental stage.' },
  { q: 'What are your school hours?', a: 'Our school day runs from 07:30 to 12:00. We also offer after-care from 13:30 to 17:00 for working parents.' },
  { q: 'Do you offer after-care?', a: 'Yes! Our after-care programme runs from 13:30 to 17:00. Children enjoy supervised play, rest time, and fun activities in a safe environment.' },
  { q: 'What is the teacher-to-child ratio?', a: 'We maintain small class sizes. Typically 1 teacher to 10–12 children, with assistant teachers in our younger groups.' },
  { q: 'Is English taught even if my child speaks another language at home?', a: 'Absolutely. English nurturing is integrated into our daily programme. Many of our children come from Afrikaans or Zulu-speaking homes and thrive in our English-rich environment.' },
  { q: 'What does it cost?', a: 'Our fees are competitive and affordable. Please contact us for a full fee schedule. We\'d love to have you visit and see our school first.' },
  { q: 'Can I visit the school before applying?', a: 'Of course! We welcome visits. Call or email us to arrange a tour — you\'ll see our classrooms, meet our teachers, and get a real feel for Ting-A-Ling.' },
  { q: 'What should my child bring?', a: 'A healthy snack, a water bottle, a sun hat, and a change of clothes. We\'ll provide the rest — all learning materials, art supplies, and outdoor equipment.' },
];

const testimonials = [
  { text: '"My little one started at Ting-A-Ling at age 2, shy and uncertain. Within weeks she was running in every morning, eager to see her friends and teachers. The growth we\'ve seen in her confidence and language is incredible."', name: '– Parent of Pre-Primary Learner', color: 'bg-teal-50 border-teal-200' },
  { text: '"The teachers genuinely care about each child. My son\'s English has improved so much since joining. The play-based approach really works — he learns without even realising it!"', name: '– Parent of Grade R Learner', color: 'bg-cyan-50 border-cyan-200' },
  { text: '"We chose Ting-A-Ling for the small classes and individual attention. Best decision we\'ve made. Our daughter is thriving, and the communication from teachers is excellent."', name: '– Parent of 4-Year-Old', color: 'bg-teal-50 border-teal-200' },
];

export default function PrePrimary() {
  const [openFaq, setOpenFaq] = React.useState(null);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-teal-800 via-teal-900 to-cyan-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-80 h-80 bg-teal-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-cyan-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm mb-6 border border-white/20">
            <Star className="w-4 h-4 text-teal-300" />
            Pre-Primary School
          </div>
          <h1 className="text-5xl font-bold mb-4">Where Little Minds Begin to Blossom</h1>
          <p className="text-xl text-teal-200 max-w-3xl mx-auto mb-6">
            A warm, play-based learning environment for children aged 3–6 in Meerensee, Richards Bay. 
            We nurture confidence, creativity, and a lifelong love of learning in every child.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-teal-200 mb-8">
            <MapPin className="w-4 h-4" /> 74 Krewilkring, Meerensee, Richards Bay
          </div>
          <Link to={createPageUrl('Apply') + '?school=PrePrimary'}>
            <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:opacity-90 px-8 py-6 text-lg">
              Apply Now
            </Button>
          </Link>
        </div>
      </section>

      {/* About */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">About Our Pre-Primary School</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              At Ting-A-Ling Pre-Primary School, we believe the early years are the most important in a child's life. 
              Our nurturing, play-based environment gives children aged 3–6 the perfect foundation for a lifetime of learning.
            </p>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Located at 74 Krewilkring in the heart of Meerensee, our school offers a warm, home-like atmosphere where children feel 
              safe to explore, make friends, and discover the joy of learning. Every day is filled with laughter, 
              creativity, and new adventures — from our outdoor playground to our bright, colourful classrooms.
            </p>
            <p className="text-slate-600 mb-4 leading-relaxed">
              English language nurturing is at the heart of our programme. Whether your child speaks English, Afrikaans, 
              isiZulu, or another language at home, we help them build strong communication skills and confidence in 
              expressing themselves.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Our teachers are qualified, experienced, and passionate about early childhood development. We work closely with 
              every family to ensure each child feels loved, supported, and ready for the next big step.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&q=80"
                alt="Children playing with building blocks"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-teal-600 text-white px-6 py-3 rounded-xl shadow-lg">
              <p className="text-2xl font-bold">15+</p>
              <p className="text-sm text-teal-200">Years of Care</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="bg-gradient-to-br from-teal-50 to-cyan-50 border-y border-teal-100">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Why Choose Us</h2>
            <p className="text-slate-500 text-lg">What makes Ting-A-Ling Pre-Primary special</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 shadow-sm border border-teal-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Daily Routine */}
      <section className="bg-gradient-to-br from-teal-50 to-cyan-50 border-y border-teal-100">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">A Day at Our School</h2>
            <p className="text-slate-500 text-lg">A typical day in our Pre-Primary programme</p>
          </div>
          <div className="max-w-3xl mx-auto">
            {dailyRoutine.map(({ time, activity, desc }, i) => (
              <div key={i} className="flex gap-4 items-start mb-4">
                <div className="w-20 shrink-0 text-right">
                  <span className="text-sm font-semibold text-teal-600">{time}</span>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-teal-500 ring-4 ring-teal-100 shrink-0" />
                  {i < dailyRoutine.length - 1 && (
                    <div className="absolute top-3 w-0.5 h-10 bg-teal-200" />
                  )}
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-teal-100 flex-1">
                  <h4 className="font-semibold text-slate-800 text-sm">{activity}</h4>
                  <p className="text-xs text-slate-500 mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programmes */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Our Programmes</h2>
          <p className="text-slate-500 text-lg">A holistic approach to early childhood development</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {programmes.map(({ Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-5 rounded-xl border border-teal-100 bg-white hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center shrink-0 mt-1">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-br from-teal-50 to-cyan-50 border-y border-teal-100">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">What Parents Say</h2>
            <p className="text-slate-500 text-lg">Real words from real Ting-A-Ling families</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ text, name, color }, i) => (
              <div key={i} className={`${color} rounded-xl p-6 shadow-sm border`}>
                <MessageCircle className="w-6 h-6 text-teal-400 mb-3" />
                <p className="text-sm text-slate-700 mb-4 leading-relaxed">{text}</p>
                <p className="text-xs font-semibold text-slate-500">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Frequently Asked Questions</h2>
          <p className="text-slate-500 text-lg">Everything you need to know about our Pre-Primary school</p>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map(({ q, a }, i) => (
            <div key={i} className="bg-white rounded-xl border border-teal-100 overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-teal-50/50 transition-colors"
              >
                <span className="font-medium text-slate-800 text-sm pr-4">{q}</span>
                <ChevronDown className={`w-4 h-4 text-teal-500 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-slate-600 leading-relaxed">{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact & Apply */}
      <section className="bg-slate-800 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join Us?</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Give your child the best start. Come see our school, meet our team, and discover the Ting-A-Ling difference.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link to={createPageUrl('Apply') + '?school=PrePrimary'}>
              <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:opacity-90 px-8 py-6 text-lg">
                Apply Now
              </Button>
            </Link>
            <a href="#contact-info">
              <Button variant="ghost" className="border border-white/30 text-white hover:bg-white/20 hover:text-white px-8 py-6 text-lg">
                Contact Us
              </Button>
            </a>
          </div>
          <div id="contact-info" className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto text-left">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <MapPin className="w-5 h-5 text-teal-400 mb-2" />
              <p className="text-sm text-slate-300">74 Krewilkring<br />Meerensee, Richards Bay</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <Phone className="w-5 h-5 text-teal-400 mb-2" />
              <p className="text-sm text-slate-300">061 527 4429<br />072 456 1281</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <Mail className="w-5 h-5 text-teal-400 mb-2" />
              <p className="text-sm text-slate-300">info@tingalingschools.com</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
