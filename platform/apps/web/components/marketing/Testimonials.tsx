'use client';

import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Owner',
    campground: 'Pine Valley RV Resort',
    location: 'Colorado',
    image: null,
    rating: 5,
    quote:
      'Camp Everyday Host has completely transformed how we run our campground. The automated booking system alone has saved us 15+ hours per week, and our revenue is up 28% year over year.',
  },
  {
    id: 2,
    name: 'Mike Patterson',
    role: 'General Manager',
    campground: 'Lakeside Campground',
    location: 'Michigan',
    image: null,
    rating: 5,
    quote:
      'The customer support is exceptional. During our migration, their team was with us every step of the way. The platform is intuitive and our staff learned it quickly.',
  },
  {
    id: 3,
    name: 'Jennifer Martinez',
    role: 'Co-Owner',
    campground: 'Mountain View Camping',
    location: 'Montana',
    image: null,
    rating: 5,
    quote:
      'We switched from our old system 6 months ago and haven\'t looked back. The reporting features give us insights we never had before, and guests love the online booking experience.',
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-base font-semibold text-emerald-600 tracking-wide uppercase mb-3">
            Testimonials
          </h2>
          <p className="text-4xl font-bold text-slate-900 mb-4">
            Loved by campground owners nationwide
          </p>
          <p className="text-xl text-slate-600">
            Don't just take our word for it—hear from the campground owners who use our platform every day.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl border-2 border-slate-200 p-8 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 relative"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-emerald-200">
                <Quote className="h-12 w-12" fill="currentColor" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-amber-400 fill-current" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-slate-700 mb-6 relative z-10">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                {/* Avatar */}
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">{testimonial.name}</div>
                  <div className="text-sm text-slate-600">
                    {testimonial.role}, {testimonial.campground}
                  </div>
                  <div className="text-xs text-slate-500">{testimonial.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">
            Join hundreds of satisfied campground owners
          </p>
          <a
            href="#demo"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            Read more success stories
            <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
