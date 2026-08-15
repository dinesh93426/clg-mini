import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
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
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-900 rounded-md animate-pulse"></div>
        <div className="h-64 bg-slate-900 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  const { feedbackSentiment, feedbackTopics, aiEventSummary } = data;

  const donutData = [
    { name: 'Positive', value: feedbackSentiment.positive, color: '#10b981' },
    { name: 'Neutral', value: feedbackSentiment.neutral, color: '#64748b' },
    { name: 'Negative', value: feedbackSentiment.negative, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white flex items-center gap-2">
          <Smile size={26} className="text-emerald-450" />
          Feedback Intelligence
        </h1>
        <p className="text-slate-400 text-sm mt-1">Aggregated sentiment indexes and natural language improvement breakdowns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Donuts and aspect listings (span 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Sentiment donut */}
          <div className="glass-card p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Overall Sentiment Index</h3>
              <div className="h-44 text-slate-400 text-xs">
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
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Sentiment Ratio</span>
              <div className="space-y-2">
                {donutData.map(entry => (
                  <div key={entry.name} className="flex items-center justify-between text-xs text-slate-350">
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
          <div className="glass-card p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Key Feedback Topics</h3>
            
            <div className="divide-y divide-slate-900 space-y-3.5 pt-1">
              {feedbackTopics.map(topic => (
                <div key={topic.name} className="flex items-center justify-between text-xs pt-3.5 first:pt-0">
                  <div>
                    <h4 className="font-semibold text-white">{topic.name}</h4>
                    <span className="text-[10px] text-slate-500">Benchmark target: 80%</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${topic.score}%` }}></div>
                    </div>
                    
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border
                      ${topic.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        topic.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                        'bg-slate-800 text-slate-400 border-slate-700'}`}
                    >
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
          <div className="p-6 rounded-2xl border border-purple-500/15 bg-gradient-to-b from-purple-500/5 to-transparent space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div>

            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={16} className="animate-pulse" />
              <span>AI Sentiment Summary</span>
            </div>

            <p className="text-xs text-purple-100 leading-relaxed font-semibold">
              "{aiEventSummary.text}"
            </p>

            <div className="space-y-4 pt-4 border-t border-slate-900 text-xs">
              
              {/* Strengths */}
              <div className="space-y-2">
                <span className="text-[10px] text-emerald-450 font-bold uppercase tracking-wider block">Key Strengths</span>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-350">
                  {aiEventSummary.strengths.map((str, i) => (
                    <li key={i} className="leading-relaxed">{str}</li>
                  ))}
                </ul>
              </div>

              {/* Issues */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Reported Issues</span>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-350">
                  {aiEventSummary.issues.map((iss, i) => (
                    <li key={i} className="leading-relaxed">{iss}</li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Recommended Adjustments</span>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-350">
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
