import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface RatingData {
  status: string;
  mean_rating: number;
  rating_counts: {
    [key: string]: number;
  };
}

interface RevenueData {
  status: string;
  total_revenue: number;
  monthly_revenue: Array<{
    month: string;
    total_revenue: number;
  }>;
}

interface AnalyticsDashboardProps {
  className?: string;
}

export default function AnalyticsDashboard({ className = "" }: AnalyticsDashboardProps) {
  const [ratingData, setRatingData] = useState<RatingData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  
  // Date range state
  const [fromDate, setFromDate] = useState<string>(() => {
    // Default to 12 months ago to show seeded data
    const date = new Date();
    date.setMonth(date.getMonth() - 12);
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  });
  
  const [toDate, setToDate] = useState<string>(() => {
    // Default to today
    const date = new Date();
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  });

  // Store the last fetched date range to track changes
  const [lastFetchedFromDate, setLastFetchedFromDate] = useState<string>(fromDate);
  const [lastFetchedToDate, setLastFetchedToDate] = useState<string>(toDate);

  // Dummy rating data
  const dummyRatingData: RatingData = {
    status: "success",
    mean_rating: 4.2,
    rating_counts: {
      "5": 10,
      "4": 5,
      "3": 2,
      "2": 1,
      "1": 0
    }
  };

  // Stable dummy revenue data starting from January 2024
  const stableMonthlyRevenue: Record<string, number> = {
    "2024-01": 567.89,
    "2024-02": 623.45,
    "2024-03": 589.12,
    "2024-04": 712.34,
    "2024-05": 678.90,
    "2024-06": 745.67,
    "2024-07": 823.45,
    "2024-08": 789.12,
    "2024-09": 856.78,
    "2024-10": 934.56,
    "2024-11": 912.34,
    "2024-12": 1023.45,
    "2025-01": 1089.67,
    "2025-02": 1156.78,
    "2025-03": 1234.56,
    "2025-04": 1312.34,
    "2025-05": 1389.12,
    "2025-06": 1467.89,
    "2025-07": 1545.67,
    "2025-08": 1623.45,
    "2025-09": 1701.23,
    "2025-10": 1789.01,
    "2025-11": 1856.78,
    "2025-12": 1934.56
  };

  // Generate dummy revenue data based on date range using stable data
  const generateDummyRevenueData = (startDate: string, endDate: string): RevenueData => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const monthlyRevenue: Array<{ month: string; total_revenue: number }> = [];
    let totalRevenue = 0;

    // Generate monthly data between start and end dates
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= endMonth) {
      const monthStr = current.toISOString().slice(0, 7); // YYYY-MM format
      
      // Get stable revenue from our predefined data, or default to 500 if not found
      const monthlyAmount = stableMonthlyRevenue[monthStr] || 500.00;
      
      monthlyRevenue.push({
        month: monthStr,
        total_revenue: monthlyAmount
      });
      
      totalRevenue += monthlyAmount;
      
      // Move to next month
      current.setMonth(current.getMonth() + 1);
    }

    return {
      status: "success",
      total_revenue: Math.round(totalRevenue * 100) / 100,
      monthly_revenue: monthlyRevenue
    };
  };

  // Format date for API (YYYY-MM-DD HH:MM:SS)
  const formatDateForAPI = (dateString: string): string => {
    // Don't use toISOString() as it converts to UTC, use local time instead
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Fetch rating data separately
  const fetchRatingData = async () => {
    try {
      setRatingError(null);
      
      const startParam = formatDateForAPI(fromDate);
      const endParam = formatDateForAPI(toDate);
      
      console.log('[fetchRatingData] Calling API with params:', { startParam, endParam });
      
      const { analyticsAPI } = await import('../api/endpoints');
      const result: RatingData = await analyticsAPI.getRatingAnalytics(startParam, endParam);
      console.log('[fetchRatingData] Rating data from API:', result);
      
      setRatingData(result);
    } catch (err) {
      console.error('[fetchRatingData] Error fetching rating data:', err);
      setRatingError(err instanceof Error ? err.message : 'Failed to load rating data');
      setRatingData(dummyRatingData);
    }
  };

  // Fetch revenue data separately
  const convertRevenueToNumber = (value: any): number => {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };
  
  // Helper function to process and normalize revenue data
  const normalizeRevenueData = (data: any): RevenueData => {
    return {
      status: data.status || "success",
      total_revenue: convertRevenueToNumber(data.total_revenue),
      monthly_revenue: (data.monthly_revenue || []).map((item: any) => ({
        month: item.month,
        total_revenue: convertRevenueToNumber(item.total_revenue)
      }))
    };
  };
  
  // Fetch revenue data separately
  const fetchRevenueData = async () => {
    try {
      setRevenueError(null);
      
      const startParam = formatDateForAPI(fromDate);
      const endParam = formatDateForAPI(toDate);
      
      console.log('[fetchRevenueData] Calling API with params:', { startParam, endParam });
      
      const { analyticsAPI } = await import('../api/endpoints');
      const rawResult = await analyticsAPI.getRevenueAnalytics(startParam, endParam);
      console.log('[fetchRevenueData] Raw revenue data from API:', rawResult);
      
      // Normalize the data to ensure proper number types
      const result: RevenueData = normalizeRevenueData(rawResult);
      console.log('[fetchRevenueData] Normalized revenue data:', result);
      
      setRevenueData(result);
    } catch (err) {
      console.error('[fetchRevenueData] Error fetching revenue data:', err);
      setRevenueError(err instanceof Error ? err.message : 'Failed to load revenue data');
      setRevenueData(generateDummyRevenueData(fromDate, toDate));
    }
  };

  // Fetch both analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch both APIs concurrently but handle errors separately
      await Promise.allSettled([
        fetchRatingData(),
        fetchRevenueData()
      ]);
      
      // Update the last fetched dates and clear unsaved changes
      setLastFetchedFromDate(fromDate);
      setLastFetchedToDate(toDate);
      setHasUnsavedChanges(false);
    } finally {
      setLoading(false);
    }
  };

  // Initial load only
  useEffect(() => {
    fetchAnalyticsData();
  }, []); // Only run on mount

  // Check for date changes to highlight refresh button
  useEffect(() => {
    const hasChanges = fromDate !== lastFetchedFromDate || toDate !== lastFetchedToDate;
    setHasUnsavedChanges(hasChanges);
  }, [fromDate, toDate, lastFetchedFromDate, lastFetchedToDate]);

  // Handle date input changes
  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromDate(e.target.value);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToDate(e.target.value);
  };

  // Transform rating data for bar chart
  const getRatingChartData = () => {
    if (!ratingData) return [];
    
    return Object.entries(ratingData.rating_counts).map(([rating, count]) => ({
      rating: `${rating}★`,
      count: count,
      fill: '#64748b'
    }));
  };

  // Transform revenue data for line chart
  const getRevenueChartData = () => {
    if (!revenueData) return [];
    
    return revenueData.monthly_revenue.map(item => ({
      month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      revenue: item.total_revenue
    }));
  };

  // Get combined error status
  const hasAnyError = ratingError || revenueError;
  const getErrorMessage = () => {
    if (ratingError && revenueError) {
      return `Rating: ${ratingError}; Revenue: ${revenueError}`;
    }
    return ratingError || revenueError || '';
  };

  return (
    <div className={`bg-white overflow-hidden ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">View restaurant performance metrics and insights</p>
          </div>
          
          {/* Date Range and Refresh Controls */}
          <div className="flex items-center space-x-4">
            {/* Date Range Inputs */}
            <div className="flex items-center space-x-2 text-sm">
              <label className="text-gray-600 font-medium">From:</label>
              <input
                type="datetime-local"
                value={fromDate}
                onChange={handleFromDateChange}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-[#1e2a59] focus:border-[#1e2a59] outline-none transition-all"
                disabled={loading}
              />
              
              <label className="text-gray-600 font-medium">To:</label>
              <input
                type="datetime-local"
                value={toDate}
                onChange={handleToDateChange}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-[#1e2a59] focus:border-[#1e2a59] outline-none transition-all"
                disabled={loading}
              />
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchAnalyticsData}
              disabled={loading}
              className={`px-4 py-2 rounded-lg transition duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                hasUnsavedChanges 
                  ? 'bg-orange-600 text-white hover:bg-orange-700 animate-pulse shadow-lg' 
                  : 'bg-[#1e2a59] text-white hover:bg-gray-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">
                {loading ? "Refreshing..." : hasUnsavedChanges ? "Update Data" : "Refresh"}
              </span>
            </button>
          </div>
        </div>
        
        {/* Date Range Display */}
        <div className="mt-2 text-xs text-gray-500">
          {hasUnsavedChanges ? (
            <span className="text-orange-600 font-medium">
              ⚠️ Date range changed. Click "Update Data" to apply changes.
            </span>
          ) : (
            <>
              Analyzing data from {new Date(lastFetchedFromDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} to {new Date(lastFetchedToDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      ) : (
        <div className="p-6">
          {/* Compact Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">
                {ratingData?.mean_rating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Rating</div>
              {ratingError && (
                <div className="text-xs text-red-500 mt-1">Sample Data</div>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">
                {Object.values(ratingData?.rating_counts || {}).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Reviews</div>
              {ratingError && (
                <div className="text-xs text-red-500 mt-1">Sample Data</div>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">
                {revenueData?.total_revenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Revenue (VND)</div>
              {revenueError && (
                <div className="text-xs text-red-500 mt-1">Sample Data</div>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">
                {revenueData && revenueData.monthly_revenue.length >= 2 ? 
                  `${(((revenueData.monthly_revenue[revenueData.monthly_revenue.length - 1].total_revenue - 
                       revenueData.monthly_revenue[revenueData.monthly_revenue.length - 2].total_revenue) / 
                       revenueData.monthly_revenue[revenueData.monthly_revenue.length - 2].total_revenue) * 100).toFixed(1)}%` :
                  '0%'
                }
              </div>
              <div className="text-sm text-gray-600">Growth Rate</div>
              {revenueError && (
                <div className="text-xs text-red-500 mt-1">Sample Data</div>
              )}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating Distribution Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Rating Distribution</h3>
                {ratingError && (
                  <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">Sample Data</span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={getRatingChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="rating" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [value, 'Reviews']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#64748b"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Trend Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Monthly Revenue</h3>
                {revenueError && (
                  <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">Sample Data</span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={getRevenueChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value.toLocaleString()} VND`, 'Revenue']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#64748b" 
                    strokeWidth={2}
                    dot={{ fill: '#64748b', strokeWidth: 1, r: 4 }}
                    activeDot={{ r: 5, stroke: '#64748b', strokeWidth: 1 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Compact Insights */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                <div>
                  <h4 className="text-sm font-medium text-slate-800">Customer Satisfaction</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {((Object.entries(ratingData?.rating_counts || {})
                      .filter(([rating]) => parseInt(rating) >= 4)
                      .reduce((sum, [, count]) => sum + count, 0) / 
                      Object.values(ratingData?.rating_counts || {}).reduce((a, b) => a + b, 1)) * 100).toFixed(1)}% 
                    rated 4+ stars
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                <div>
                  <h4 className="text-sm font-medium text-slate-800">Average Monthly</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {revenueData ? 
                      `${(revenueData.monthly_revenue.reduce((sum, item) => sum + item.total_revenue, 0) / 
                         revenueData.monthly_revenue.length).toLocaleString()} VND` :
                      'Calculating...'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                <div>
                  <h4 className="text-sm font-medium text-slate-800">Data Period</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {revenueData?.monthly_revenue.length || 0} months tracked
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}