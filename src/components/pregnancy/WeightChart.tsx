import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { format, parseISO } from 'date-fns';
import { WeightLog } from '@/integrations/firebase/types';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface WeightChartProps {
  weightLogs: WeightLog[];
}

export function WeightChart({ weightLogs }: WeightChartProps) {
  const chartData = useMemo(() => {
    // Create a map to store the most recent weight for each date
    const weightMap = new Map<string, WeightLog>();
    
    // Sort logs by date and createdAt to get the most recent entry for each date
    const sortedLogs = [...weightLogs].sort((a, b) => {
      // First sort by date
      const dateComparison = parseISO(a.date).getTime() - parseISO(b.date).getTime();
      if (dateComparison !== 0) return dateComparison;
      
      // If same date, sort by createdAt to get the most recent
      return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
    });

    // Keep only the most recent entry for each date
    sortedLogs.forEach(log => {
      weightMap.set(log.date, log);
    });

    // Convert map back to array and sort by date
    const uniqueLogs = Array.from(weightMap.values())
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    return {
      labels: uniqueLogs.map(log => format(parseISO(log.date), 'MMM d')), // Dates for the x-axis
      datasets: [
        {
          label: 'Weight',
          data: uniqueLogs.map(log => log.weight), // Weight values for the y-axis
          borderColor: 'rgb(255, 99, 132)', // Pink color
          backgroundColor: 'rgba(255, 99, 132, 0.5)', // Pink with transparency
          tension: 0.1, // Makes the line slightly curved
        },
      ],
    };
  }, [weightLogs]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false, // Allow height to be controlled by parent container
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Weight Over Time',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            return `Weight: ${value} kg/lbs`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Weight (kg/lbs)', // Assuming units based on input
        },
      },
    },
  }), []);

  return (
    <div style={{ height: '300px' }}> {/* Set a height for the chart container */}
      <Line data={chartData} options={options} />
    </div>
  );
} 