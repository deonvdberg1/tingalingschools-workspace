import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function PolicyDoc({ title, children }) {
  return (
    <article className="bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-sm font-medium text-teal-700 mb-2">Ting-A-Ling Schools</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">{title}</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: November 2026</p>
        <div className="policy-body space-y-6 text-slate-700 leading-relaxed">
          {children}
        </div>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-3">Contact us</h2>
          <p className="text-slate-600 mb-4">
            If you have questions about these terms or about your child's enrolment, please contact the school office.
          </p>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-teal-600 mt-1 shrink-0" />
              <span>
                Pre-Primary School: 74 Krewilkring, Meerensee, Richards Bay
                <br />
                Special Needs School: 18 Elweboog, Meerensee, Richards Bay
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                <a href="tel:0615274429" className="text-teal-700 hover:underline">061 527 4429</a>
                {' / '}
                <a href="tel:0724561281" className="text-teal-700 hover:underline">072 456 1281</a>
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-teal-600 shrink-0" />
              <a href="mailto:info@tingalingschools.com" className="text-teal-700 hover:underline">
                info@tingalingschools.com
              </a>
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}

export function PolicyHeading({ children }) {
  return <h2 className="text-xl font-bold text-slate-800 pt-2">{children}</h2>;
}

export function PolicyLink({ to, children }) {
  return (
    <Link to={to} className="text-teal-700 font-medium hover:underline">
      {children}
    </Link>
  );
}
