import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { groupBy, sumBy } from 'lodash';
import { fetchTrainings } from '../services/personalTrainerApi';
import type { TrainingDto } from '../services/personalTrainerApi';

type ActivityStats = {
  activity: string;
  duration: number;
};

const StatisticsPage = () => {
  const [trainings, setTrainings] = useState<TrainingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrainings = async () => {
      try {
        setIsLoading(true);
        const data = await fetchTrainings();
        setTrainings(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load trainings.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTrainings();
  }, []);

  const activityStats: ActivityStats[] = useMemo(() => {
    // Group trainings by activity
    const grouped = groupBy(trainings, 'activity');

    // Calculate total duration for each activity
    const stats = Object.entries(grouped).map(([activity, activityTrainings]) => ({
      activity,
      duration: sumBy(activityTrainings, 'duration'),
    }));

    // Sort by duration (descending)
    return stats.sort((a, b) => b.duration - a.duration);
  }, [trainings]);

  if (isLoading) {
    return (
      <section>
        <header>
          <h1>Statistics</h1>
          <p>Training activity statistics.</p>
        </header>
        <p>Loading trainings…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <header>
          <h1>Statistics</h1>
          <p>Training activity statistics.</p>
        </header>
        <p>{error}</p>
      </section>
    );
  }

  return (
    <section>
      <header>
        <h1>Statistics</h1>
        <p>Training activity statistics.</p>
      </header>

      {activityStats.length === 0 ? (
        <p>No training data available.</p>
      ) : (
        <div style={{ width: '100%', height: '500px', marginTop: '2rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activityStats}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="activity"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis label={{ value: 'Duration (min)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value: number) => [`${value} min`, 'Duration']}
                labelFormatter={(label) => `Activity: ${label}`}
              />
              <Bar dataKey="duration" fill="#2196f3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activityStats.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Activity</th>
                <th>Total Duration (min)</th>
                <th>Number of Sessions</th>
              </tr>
            </thead>
            <tbody>
              {activityStats.map((stat) => {
                const sessionCount = trainings.filter((t) => t.activity === stat.activity).length;
                return (
                  <tr key={stat.activity}>
                    <td>{stat.activity}</td>
                    <td>{stat.duration}</td>
                    <td>{sessionCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default StatisticsPage;

