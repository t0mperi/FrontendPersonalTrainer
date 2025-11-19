import { useEffect, useState } from 'react';
import { fetchTrainings } from '../services/personalTrainerApi';
import type { TrainingDto } from '../services/personalTrainerApi';

const TrainingsPage = () => {
  const [trainings, setTrainings] = useState<TrainingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
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

    load();
  }, []);

  return (
    <section>
      <header>
        <h1>Trainings</h1>
        <p>All scheduled sessions.</p>
      </header>

      {isLoading && <p>Loading trainings…</p>}
      {error && <p>{error}</p>}

      {!isLoading && !error && (
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>Duration (min)</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {trainings.map((training, index) => (
              <tr key={index}>
                <td>{training.activity}</td>
                <td>{training.duration}</td>
                <td>{training.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default TrainingsPage;

