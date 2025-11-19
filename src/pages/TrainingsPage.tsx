import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fi';
import { fetchTrainings } from '../services/personalTrainerApi';
import type { TrainingDto } from '../services/personalTrainerApi';

dayjs.locale('fi');

type TrainingRow = TrainingDto & { id: string };
type SortKey = 'date' | 'duration' | 'activity' | 'customer';
type SortDirection = 'asc' | 'desc';

const createIdFromSelfLink = (selfHref?: string) => {
  if (!selfHref) return crypto.randomUUID();
  return selfHref.substring(selfHref.lastIndexOf('/') + 1);
};

const TrainingsPage = () => {
  const [trainings, setTrainings] = useState<TrainingRow[]>([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchTrainings();
        setTrainings(
          data.map((training) => ({
            ...training,
            id: createIdFromSelfLink(training._links?.self?.href),
          }))
        );
      } catch (err) {
        console.error(err);
        setError('Failed to load trainings.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const filteredTrainings = useMemo(() => {
    if (!search.trim()) return trainings;

    const term = search.toLowerCase();
    return trainings.filter((training) => {
      const matchesActivity = training.activity?.toLowerCase().includes(term);
      const customerName = `${training.customer?.firstname ?? ''} ${
        training.customer?.lastname ?? ''
      }`.trim();
      const matchesCustomer = customerName.toLowerCase().includes(term);
      return matchesActivity || matchesCustomer;
    });
  }, [trainings, search]);

  const sortedTrainings = useMemo(() => {
    return [...filteredTrainings].sort((a, b) => {
      const directionMultiplier = sortDirection === 'asc' ? 1 : -1;

      switch (sortKey) {
        case 'duration':
          return (a.duration - b.duration) * directionMultiplier;
        case 'activity':
          return (
            a.activity.localeCompare(b.activity) * directionMultiplier
          );
        case 'customer': {
          const nameA = `${a.customer?.firstname ?? ''} ${
            a.customer?.lastname ?? ''
          }`.trim();
          const nameB = `${b.customer?.firstname ?? ''} ${
            b.customer?.lastname ?? ''
          }`.trim();
          return nameA.localeCompare(nameB) * directionMultiplier;
        }
        case 'date':
        default:
          return (
            (dayjs(a.date).valueOf() - dayjs(b.date).valueOf()) *
            directionMultiplier
          );
      }
    });
  }, [filteredTrainings, sortDirection, sortKey]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const formatDate = (iso: string) => dayjs(iso).format('DD.MM.YYYY HH:mm');

  const renderSortHint = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <section>
      <header>
        <h1>Trainings</h1>
        <p>All scheduled sessions.</p>
      </header>

      <div>
        <label htmlFor="training-search">Search trainings</label>
        <input
          id="training-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Activity or customer..."
        />
      </div>

      {isLoading && <p>Loading trainings…</p>}
      {error && <p>{error}</p>}

      {!isLoading && !error && (
        <table>
          <thead>
            <tr>
              <th>
                <button type="button" onClick={() => toggleSort('customer')}>
                  Customer{renderSortHint('customer')}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => toggleSort('activity')}>
                  Activity{renderSortHint('activity')}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => toggleSort('duration')}>
                  Duration (min){renderSortHint('duration')}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => toggleSort('date')}>
                  Date{renderSortHint('date')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTrainings.map((training) => (
              <tr key={training.id}>
                <td>
                  {training.customer
                    ? `${training.customer.firstname} ${training.customer.lastname}`
                    : '—'}
                </td>
                <td>{training.activity}</td>
                <td>{training.duration}</td>
                <td>{formatDate(training.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default TrainingsPage;

