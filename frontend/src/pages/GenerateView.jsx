import { useState } from 'react';
import { FileText, Award, Mail, Download, Sparkles, ArrowRight } from 'lucide-react';
import PerformanceReviewWizard from '../components/generate/PerformanceReviewWizard';
import ResumeBulletsWizard from '../components/generate/ResumeBulletsWizard';

function GenerateView() {
  const [selectedGenerator, setSelectedGenerator] = useState(null);

  const generators = [
    {
      id: 'performance-review',
      title: '📊 Personal Performance Review',
      description: 'Generate a comprehensive performance review from your journal entries',
      icon: Award,
      available: true,
      features: [
        'Competency-based structure',
        'Quantified achievements',
        'Professional formatting',
        'Editable output'
      ]
    },
    {
      id: 'resume-bullets',
      title: '🎯 Resume Bullet Points',
      description: 'Create compelling resume bullets that showcase your impact',
      icon: FileText,
      available: true,
      features: [
        'Action-oriented language',
        'Quantified results',
        'Industry-specific keywords',
        'ATS-friendly format'
      ]
    },
    {
      id: 'cover-letter',
      title: '✉️ Cover Letter',
      description: 'Coming in Phase 2 - Personalized cover letters for job applications',
      icon: Mail,
      available: false,
      features: [
        'Tailored to job description',
        'Highlights relevant experience',
        'Professional tone',
        'Company research integration'
      ]
    }
  ];

  const handleGeneratorSelect = (generatorId) => {
    setSelectedGenerator(generatorId);
  };

  if (selectedGenerator === 'performance-review') {
    return <PerformanceReviewWizard onBack={() => setSelectedGenerator(null)} />;
  }

  if (selectedGenerator === 'resume-bullets') {
    return <ResumeBulletsWizard onBack={() => setSelectedGenerator(null)} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Generate</h1>
        </div>
        <p className="text-lg text-gray-600">
          Transform your journal entries into professional career documents
        </p>
      </div>

      {/* Generator Options Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {generators.map((generator) => {
          const IconComponent = generator.icon;
          
          return (
            <div
              key={generator.id}
              className={`
                relative bg-white border-2 rounded-xl p-6 transition-all duration-200 h-full flex flex-col
                ${generator.available 
                  ? 'border-gray-200 hover:border-blue-300 hover:shadow-lg cursor-pointer' 
                  : 'border-gray-100 opacity-60 cursor-not-allowed'
                }
              `}
              onClick={() => generator.available && handleGeneratorSelect(generator.id)}
            >
              {!generator.available && (
                <div className="absolute top-4 right-4 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
                  Phase 2
                </div>
              )}

              {/* Icon and Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`
                  p-3 rounded-lg
                  ${generator.available ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}
                `}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {generator.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {generator.description}
                  </p>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2 mb-6 flex-grow">
                {generator.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`
                      w-1.5 h-1.5 rounded-full
                      ${generator.available ? 'bg-blue-400' : 'bg-gray-300'}
                    `} />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="mt-auto">
                {generator.available ? (
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2">
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    className="w-full bg-gray-100 text-gray-400 px-4 py-3 rounded-lg font-medium cursor-not-allowed"
                    disabled
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Usage Stats */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Ready to generate professional documents from your journal entries
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Need raw data export? Visit the Insights tab and click the Export button
        </p>
      </div>
    </div>
  );
}

export default GenerateView;