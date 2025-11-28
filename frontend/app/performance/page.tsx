"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Brain, BarChart3, Calendar, Award } from 'lucide-react';

interface PerformanceData {
  totalDecisions: number;
  accuracy: number;
  avgConfidence: number;
  winRate: number;
  actionDistribution: {
    buy: number;
    sell: number;
    hold: number;
  };
  recentPerformance: Array<{
    date: string;
    avgConfidence: number;
    decisions: number;
    actions: {
      buy: number;
      sell: number;
      hold: number;
    };
  }>;
  daysTracked: number;
}

export default function PerformancePage() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://ai-trader-backend-3nsl.onrender.com/api/performance');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setPerformanceData(data.performance);
      } else {
        throw new Error(data.error || 'Failed to fetch performance data');
      }
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-6 flex items-center justify-center">
        <div className="text-emerald-400 text-xl">Loading AI Performance Metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-6 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
          <h2 className="text-red-400 text-lg font-bold mb-2">Error Loading Performance</h2>
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchPerformanceData}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-6 flex items-center justify-center">
        <div className="text-slate-400 text-lg">No performance data available</div>
      </div>
    );
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy': return 'text-emerald-400 bg-emerald-900/20';
      case 'sell': return 'text-red-400 bg-red-900/20';
      case 'hold': return 'text-yellow-400 bg-yellow-900/20';
      default: return 'text-slate-400 bg-slate-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-400 mb-2 flex items-center justify-center gap-3">
            <Brain className="w-10 h-10" />
            AI Performance Analytics
          </h1>
          <p className="text-slate-300 text-lg">
            Track how well our AI is performing in the markets
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Accuracy */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-emerald-400" />
              <span className="text-2xl font-bold text-emerald-400">
                {performanceData.accuracy}%
              </span>
            </div>
            <h3 className="text-slate-300 text-sm font-semibold">AI Accuracy</h3>
            <p className="text-slate-400 text-xs mt-1">Prediction accuracy rate</p>
          </div>

          {/* Win Rate */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-blue-400">
                {performanceData.winRate}%
              </span>
            </div>
            <h3 className="text-slate-300 text-sm font-semibold">Win Rate</h3>
            <p className="text-slate-400 text-xs mt-1">Profitable trades</p>
          </div>

          {/* Average Confidence */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Brain className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-purple-400">
                {Math.round(performanceData.avgConfidence * 100)}%
              </span>
            </div>
            <h3 className="text-slate-300 text-sm font-semibold">Avg Confidence</h3>
            <p className="text-slate-400 text-xs mt-1">AI certainty level</p>
          </div>

          {/* Total Decisions */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-orange-400" />
              <span className="text-2xl font-bold text-orange-400">
                {performanceData.totalDecisions}
              </span>
            </div>
            <h3 className="text-slate-300 text-sm font-semibold">Total Decisions</h3>
            <p className="text-slate-400 text-xs mt-1">Across {performanceData.daysTracked} sessions</p>
          </div>
        </div>

        {/* Action Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Action Breakdown */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-slate-200 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Action Distribution
            </h3>
            <div className="space-y-4">
              {Object.entries(performanceData.actionDistribution).map(([action, count]) => {
                const percentage = performanceData.totalDecisions > 0 
                  ? Math.round((count / performanceData.totalDecisions) * 100) 
                  : 0;
                
                return (
                  <div key={action} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold uppercase ${getActionColor(action)}`}>
                        {action}
                      </div>
                      <span className="text-slate-300">{count} decisions</span>
                    </div>
                    <div className="text-slate-400">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Performance */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-slate-200 mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Recent Performance
            </h3>
            <div className="space-y-3">
              {performanceData.recentPerformance.length > 0 ? (
                performanceData.recentPerformance.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <div className="text-slate-300 font-medium">{day.date}</div>
                      <div className="text-slate-400 text-sm">{day.decisions} decisions</div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-semibold">
                        {Math.round(day.avgConfidence * 100)}%
                      </div>
                      <div className="text-slate-400 text-xs">confidence</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-center py-8">
                  No recent performance data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={fetchPerformanceData}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 mx-auto"
          >
            <TrendingUp className="w-5 h-5" />
            Refresh Performance Data
          </button>
        </div>
      </div>
    </div>
  );
}