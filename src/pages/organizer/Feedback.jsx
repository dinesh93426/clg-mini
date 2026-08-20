import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { MOCK_ORGANIZER_ANALYTICS } from '../../services/mockData';
import { 
  Sparkles, Smile, Meh, Frown, CheckCircle, 
  AlertCircle, ShieldCheck, ChevronRight, HelpCircle 
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const FeedbackIntelligence = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeedback = async () => {
      setLoading(true);
      try {
        const res = await analyticsService.getOrganizerOverview();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadFeedback();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-48 bg-[#E2E8F0] rounded"></div>
        <div className="h-64 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl"></div>
      </div>
    );
  }

  const hasFeedback = !!data.feedbackSentiment;

  if (!hasFeedback) {
    return (
      <div className="space-y-6 pb-12">
        <div className="border-b border-[#E2E8F0] pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-[#172033] flex items-center gap-2">
            <Smile size={22} className="text-[#16A34A]" />
            Feedback Intelligence
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">Aggregated sentiment indexes and natural language improvement breakdowns.</p>
        </div>
        <div className="py-12 text-center space-y-3 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-xs">
          <HelpCircle size={32} className="text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-semibold text-[#172033]">No Feedback Data Available</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Your events haven't received any feedback yet. Feedback intelligence will appear here once students submit their reviews.
          </p>
        </div>
      </div>
    );
  }

  const feedbackSentiment = data.feedbackSentiment;
  const feedbackTopics = data.feedbackTopics;
  const aiEventSummary = data.aiEventSummary;

  const donutData = [
    { name: 'Positive', value: feedbackSentiment.positive, color: '#16A34A' },
    { name: 'Neutral', value: feedbackSentiment.neutral, color: '#64748B' },
    { name: 'Negative', value: feedbackSentiment.negative, color: '#DC2626' }
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#172033] flex items-center gap-2">
          <Smile size={22} className="text-[#16A34A]" />
          Feedback Intelligence
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">Aggregated sentiment indexes and natural language improvement breakdowns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Donuts and aspect listings (span 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Sentiment donut */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">Overall Sentiment Index</h3>
              <div className="h-44 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Sentiment Ratio</span>
              <div className="space-y-1.5">
                {donutData.map(entry => (
                  <div key={entry.name} className="flex items-center justify-between text-xs text-[#172033]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                      <span>{entry.name}</span>
                    </div>
                    <span className="font-semibold">{entry.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Aspect Ratings list */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 rounded-2xl shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Key Feedback Topics</h3>
            
            <div className="divide-y divide-[#E2E8F0]">
              {feedbackTopics.map(topic => (
                <div key={topic.name} className="flex items-center justify-between text-xs py-3 first:pt-0 last:pb-0">
                  <div>
                    <h4 className="font-semibold text-[#172033]">{topic.name}</h4>
                    <span className="text-[10px] text-[#94A3B8]">Target benchmark: 80%</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full bg-[#FF5A1F] rounded-full" style={{ width: `${topic.score}%` }}></div>
                    </div>
                    
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      topic.sentiment === 'positive' ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]' : 
                      topic.sentiment === 'negative' ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]' : 
                      'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                    }`}>
                      {topic.score}% • {topic.sentiment}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: AI Summary report (span 5) */}
        <div className="lg:col-span-5">
          <div className="p-5 rounded-2xl border border-[#FFD2C2] bg-[#FFFFFF] shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#FF5A1F] text-xs font-bold uppercase tracking-wider">
              <Sparkles size={15} />
              <span>AI Sentiment Summary</span>
            </div>

            <p className="text-xs text-[#172033] leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] font-medium">
              "{aiEventSummary.text}"
            </p>

            <div className="space-y-3 pt-2 text-xs">
              
              {/* Strengths */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-[#16A34A] font-bold uppercase tracking-wider block">Key Strengths</span>
                <ul className="space-y-1 list-disc pl-4 text-[#172033]">
                  {aiEventSummary.strengths.map((str, i) => (
                    <li key={i} className="leading-relaxed">{str}</li>
                  ))}
                </ul>
              </div>

              {/* Issues */}
              <div className="space-y-1.5 pt-1 border-t border-[#E2E8F0]">
                <span className="text-[10px] text-[#DC2626] font-bold uppercase tracking-wider block">Reported Issues</span>
                <ul className="space-y-1 list-disc pl-4 text-[#172033]">
                  {aiEventSummary.issues.map((iss, i) => (
                    <li key={i} className="leading-relaxed">{iss}</li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="space-y-1.5 pt-1 border-t border-[#E2E8F0]">
                <span className="text-[10px] text-[#FF5A1F] font-bold uppercase tracking-wider block">Recommended Adjustments</span>
                <ul className="space-y-1 list-disc pl-4 text-[#172033]">
                  {aiEventSummary.improvements.map((imp, i) => (
                    <li key={i} className="leading-relaxed">{imp}</li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
export default FeedbackIntelligence;
