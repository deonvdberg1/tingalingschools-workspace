import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Heart, Users, Star, Shield, Palette, Music, BookOpen, Smile, Clock, MessageCircle, HelpCircle, ChevronDown, Camera, Clock4 } from 'lucide-react';

const highlights = [
  { Icon: Heart, title: 'Individualised Programmes', desc: 'Every child receives a tailored learning plan designed around their unique strengths, needs, and developmental goals.' },
  { Icon: Users, title: 'Small Class Sizes', desc: 'Low learner-to-teacher ratios ensure each child gets the focused attention and support they deserve.' },
  { Icon: Star, title: 'English Nurturing', desc: 'Language development is woven into every activity to build communication skills at each child\'s own pace.' },
  { Icon: Shield, title: 'Therapy Support', desc: 'Close collaboration with speech, occupational, and play therapists — both on-site and through referrals.' },
];

const programmes = [
  { Icon: BookOpen, title: 'Academic Foundation', desc: 'Early literacy, numeracy, and cognitive skills development tailored to each child\'s learning pace and style.' },
  { Icon: Palette, title: 'Creative Expression', desc: 'Art, music, and sensory play to encourage self-expression, fine motor development, and emotional release.' },
  { Icon: Music, title: 'Life Skills', desc: 'Social interaction, emotional regulation, independence, and practical daily living skills for greater self-confidence.' },
  { Icon: Smile, title: 'English Nurturing', desc: 'Dedicated language support to help every child communicate with confidence, using tools like picture cards, songs, and repetition.' },
];

const dailyRoutine = [
  { time: '06:45 – 07:30', activity: 'Early Drop-off Arrival', desc: 'Arrival and settling in for early learners' },
  { time: '07:30 – 08:00', activity: 'Morning Free Play', desc: 'Free choice activities as children arrive' },
  { time: '08:00 – 08:30', activity: 'Morning Ring', desc: 'Greeting, setting the day\'s intentions, songs' },
  { time: '08:30 – 09:15', activity: 'Individual Learning Time', desc: 'Targeted activities based on each child\'s learning plan' },
  { time: '09:15 – 09:45', activity: 'Snack & Social Time', desc: 'Eating together, building social skills and routines' },
  { time: '09:45 – 10:30', activity: 'Therapy & Sensory Play', desc: 'Gross motor, sensory exploration, and therapeutic activities' },
  { time: '10:30 – 11:00', activity: 'Outdoor Time', desc: 'Fresh air, movement, and nature-based play' },
  { time: '11:00 – 11:30', activity: 'Creative & Life Skills', desc: 'Art, music, cooking, or practical life activities' },
  { time: '11:30 – 12:00', activity: 'Lunch', desc: 'Nutritious lunch together with friends' },
  { time: '12:00 – 13:00', activity: 'Quiet Play & Rest', desc: 'Calm activities, rest time for younger learners' },
  { time: '13:00 – 13:30', activity: 'Story Time & Dismissal', desc: 'Winding down with a story, then home time' },
  { time: '13:30 – 17:00', activity: 'After-Care Programme', desc: 'Supervised play, rest, and activities for working parents' },
];

const faqs = [
  { q: 'What ages do you accept?', a: 'We accept children from 3 to 12 years old. Every child is assessed individually to ensure we can meet their needs.' },
  { q: 'What learning needs do you support?', a: 'We support a range of learning needs including autism spectrum disorder, ADHD, developmental delays, speech and language difficulties, and mild to moderate intellectual disabilities. Contact us to discuss your child\'s specific needs.' },
  { q: 'Do you provide therapy on-site?', a: 'We work closely with speech therapists, occupational therapists, and play therapists who visit the school. We also provide referrals to trusted practitioners in Richards Bay and the surrounding area.' },
  { q: 'What is the teacher-to-child ratio?', a: 'We maintain very small class sizes with high teacher-to-child ratios to ensure each child receives the attention and support they need.' },
  { q: 'How do you support English learning?', a: 'English nurturing is integrated throughout the day using visual aids, songs, repetition, and one-on-one support. We meet each child at their current level and build from there.' },
  { q: 'Can I visit the school before enrolling?', a: 'Absolutely. We encourage parents to visit, meet our team, and see if our environment is the right fit for their child. Call or email to arrange a tour.' },
  { q: 'What does it cost?', a: 'Fees vary depending on the level of support your child needs. Contact us for a personalised fee assessment. We\'re committed to making quality special needs education accessible.' },
  { q: 'How do I apply?', a: 'Start by filling out our online application form. We\'ll then invite you and your child for a meet-and-greet and assessment to ensure we can provide the right support.' },
  { q: 'What are your school hours?', a: 'Our school day runs from 06:45 (early drop-off) to 13:30. We also offer after-care from 13:30 to 17:00 for working parents.' },
  { q: 'Do you offer after-care?', a: 'Yes! Our after-care programme runs from 13:30 to 17:00. Children enjoy supervised play, rest time, and activities in a safe, supportive environment.' },
];

const testimonials = [
  { text: '"When we first came to Ting-A-Ling, we were nervous. Our child had struggled at other schools. Here, they didn\'t just see the challenges — they saw our child\'s potential. The progress has been remarkable."', name: '– Parent of Special Needs Learner', color: 'bg-purple-50 border-purple-200' },
  { text: '"The teachers are patient, kind, and incredibly skilled. They truly understand our child\'s needs and celebrate every small victory. We\'re so grateful to have found Ting-A-Ling."', name: '– Parent of 6-Year-Old', color: 'bg-pink-50 border-pink-200' },
  { text: '"The individual attention has made all the difference. Our child is happier, more confident, and actually excited to go to school. That means everything to us."', name: '– Parent of 8-Year-Old', color: 'bg-purple-50 border-purple-200' },
];

export default function SpecialNeeds() {
  const [openFaq, setOpenFaq] = React.useState(null);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-purple-800 via-purple-900 to-pink-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-80 h-80 bg-purple-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-pink-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm mb-6 border border-white/20">
            <Heart className="w-4 h-4 text-pink-300" />
            Special Needs School
          </div>
          <h1 className="text-5xl font-bold mb-4">Every Child Deserves to Shine</h1>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto mb-6">
            A nurturing, inclusive environment at 18 Elweboog, Meerensee, where children with diverse learning needs 
            are celebrated, supported, and empowered to reach their full potential.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-purple-200 mb-8">
            <MapPin className="w-4 h-4" /> 18 Elweboog, Meerensee, Richards Bay
          </div>
          <Link to={createPageUrl('Apply') + '?school=SpecialNeeds'}>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90 px-8 py-6 text-lg">
              Apply Now
            </Button>
          </Link>
        </div>
      </section>

      {/* About */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">About Our Special Needs School</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              At Ting-A-Ling Special Needs School, we believe every child is unique and capable of remarkable things. 
              Our dedicated team of specialists creates personalised educational programmes in a warm, supportive environment 
              where children feel safe, valued, and inspired.
            </p>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Located at 18 Elweboog in Meerensee, Richards Bay, our school is purpose-designed to accommodate diverse learning needs. 
              Our classrooms are calm, welcoming spaces with sensory-friendly elements to help children feel at ease and ready to learn.
            </p>
            <p className="text-slate-600 mb-4 leading-relaxed">
              We work closely with families, therapists, and caregivers to ensure a holistic approach to each child's development. 
              Communication between school and home is constant — we believe parents are our most important partners.
            </p>
            <p className="text-slate-600 leading-relaxed">
              English language nurturing is integrated throughout our curriculum, using visual supports, repetition, and 
              gentle encouragement to help every child find their voice and communicate with confidence.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80"
                alt="Special Needs classroom"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-purple-600 text-white px-6 py-3 rounded-xl shadow-lg">
              <p className="text-2xl font-bold">15+</p>
              <p className="text-sm text-purple-200">Years of Care</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="bg-gradient-to-br from-purple-50 to-pink-50 border-y border-purple-100">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Why Choose Us</h2>
            <p className="text-slate-500 text-lg">What makes our Special Needs school different</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
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
      <section className="bg-gradient-to-br from-purple-50 to-pink-50 border-y border-purple-100">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">A Day at Our School</h2>
            <p className="text-slate-500 text-lg">How we structure each day for comfort and progress</p>
          </div>
          <div className="max-w-3xl mx-auto">
            {dailyRoutine.map(({ time, activity, desc }, i) => (
              <div key={i} className="flex gap-4 items-start mb-4">
                <div className="w-20 shrink-0 text-right">
                  <span className="text-sm font-semibold text-purple-600">{time}</span>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-100 shrink-0" />
                  {i < dailyRoutine.length - 1 && (
                    <div className="absolute top-3 w-0.5 h-10 bg-purple-200" />
                  )}
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100 flex-1">
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
          <p className="text-slate-500 text-lg">Comprehensive support for every child's journey</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {programmes.map(({ Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-5 rounded-xl border border-purple-100 bg-white hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shrink-0 mt-1">
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
      <section className="bg-gradient-to-br from-purple-50 to-pink-50 border-y border-purple-100">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">What Parents Say</h2>
            <p className="text-slate-500 text-lg">Real words from real Ting-A-Ling families</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ text, name, color }, i) => (
              <div key={i} className={`${color} rounded-xl p-6 shadow-sm border`}>
                <MessageCircle className="w-6 h-6 text-purple-400 mb-3" />
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
          <p className="text-slate-500 text-lg">Everything you need to know about our Special Needs school</p>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map(({ q, a }, i) => (
            <div key={i} className="bg-white rounded-xl border border-purple-100 overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-purple-50/50 transition-colors"
              >
                <span className="font-medium text-slate-800 text-sm pr-4">{q}</span>
                <ChevronDown className={`w-4 h-4 text-purple-500 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
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
          <h2 className="text-3xl font-bold mb-4">Ready to Take the Next Step?</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            We'd love to meet your family and show you around our school. Get in touch or apply online today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link to={createPageUrl('Apply') + '?school=SpecialNeeds'}>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90 px-8 py-6 text-lg">
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
              <MapPin className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-sm text-slate-300">18 Elweboog<br />Meerensee, Richards Bay</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <Phone className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-sm text-slate-300">061 527 4429<br />072 456 1281</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <Mail className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-sm text-slate-300">info@tingalingschools.com</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
