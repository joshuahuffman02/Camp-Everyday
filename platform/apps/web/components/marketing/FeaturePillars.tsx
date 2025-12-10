'use client';

import {
  TrendingUp,
  Settings,
  Megaphone,
  Users,
  Zap,
  BarChart3,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    name: 'Growth & Revenue',
    description: 'Maximize bookings and optimize pricing with intelligent revenue management tools.',
    icon: TrendingUp,
    color: 'emerald',
    features: [
      'Dynamic pricing optimization',
      'Channel management',
      'Revenue analytics',
      'Seasonal rate automation',
    ],
  },
  {
    name: 'Management & Operations',
    description: 'Streamline daily operations with powerful automation and workflows.',
    icon: Settings,
    color: 'blue',
    features: [
      'Reservation management',
      'Site assignment & grid',
      'Maintenance tracking',
      'Staff management',
    ],
  },
  {
    name: 'Marketing & Distribution',
    description: 'Expand your reach with integrated marketing tools and OTA connections.',
    icon: Megaphone,
    color: 'purple',
    features: [
      'Email campaigns',
      'OTA marketplace',
      'SEO optimization',
      'Social media integration',
    ],
  },
  {
    name: 'Guest Experience',
    description: 'Delight guests with seamless booking, check-in, and communication.',
    icon: Users,
    color: 'pink',
    features: [
      'Online booking engine',
      'Mobile check-in',
      'Guest portal',
      'Automated messaging',
    ],
  },
  {
    name: 'Integrations & Apps',
    description: 'Connect with your favorite tools and extend functionality.',
    icon: Zap,
    color: 'amber',
    features: [
      'Payment processors',
      'Accounting software',
      'POS systems',
      'Third-party apps',
    ],
  },
  {
    name: 'Data & Reporting',
    description: 'Make informed decisions with comprehensive analytics and insights.',
    icon: BarChart3,
    color: 'teal',
    features: [
      'Custom dashboards',
      'Financial reports',
      'Occupancy analytics',
      'Performance metrics',
    ],
  },
];

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-100',
    icon: 'text-emerald-600',
    hover: 'hover:border-emerald-300',
  },
  blue: {
    bg: 'bg-blue-100',
    icon: 'text-blue-600',
    hover: 'hover:border-blue-300',
  },
  purple: {
    bg: 'bg-purple-100',
    icon: 'text-purple-600',
    hover: 'hover:border-purple-300',
  },
  pink: {
    bg: 'bg-pink-100',
    icon: 'text-pink-600',
    hover: 'hover:border-pink-300',
  },
  amber: {
    bg: 'bg-amber-100',
    icon: 'text-amber-600',
    hover: 'hover:border-amber-300',
  },
  teal: {
    bg: 'bg-teal-100',
    icon: 'text-teal-600',
    hover: 'hover:border-teal-300',
  },
};

export function FeaturePillars() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-base font-semibold text-emerald-600 tracking-wide uppercase mb-3">
            Complete Solution
          </h2>
          <p className="text-4xl font-bold text-slate-900 mb-4">
            Everything you need to run your campground
          </p>
          <p className="text-xl text-slate-600">
            From bookings to check-out, we've got every aspect of your operation covered.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            const colors = colorClasses[feature.color as keyof typeof colorClasses];

            return (
              <div
                key={feature.name}
                className={`group relative bg-white rounded-2xl border-2 border-slate-200 p-8 transition-all duration-300 hover:shadow-xl ${colors.hover}`}
              >
                {/* Icon */}
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${colors.bg} mb-6`}>
                  <Icon className={`h-7 w-7 ${colors.icon}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.name}
                </h3>
                <p className="text-slate-600 mb-6">
                  {feature.description}
                </p>

                {/* Feature List */}
                <ul className="space-y-2 mb-6">
                  {feature.features.map((item) => (
                    <li key={item} className="flex items-center text-sm text-slate-600">
                      <svg
                        className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Learn More Link */}
                <a
                  href={`#${feature.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 group-hover:translate-x-1 transition-transform"
                >
                  Learn more
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>

                {/* Hover Effect */}
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
