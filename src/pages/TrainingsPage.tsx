import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fi';
import {
  fetchTrainings,
  fetchCustomers,
  createTraining,
  deleteTraining,
} from '../services/personalTrainerApi';
import type { TrainingDto, CustomerDto } from '../services/personalTrainerApi';

dayjs.locale('fi');

type TrainingRow = TrainingDto & { id: string };
type CustomerOption = CustomerDto & { id: string };
type SortKey = 'date' | 'duration' | 'activity' | 'customer';
type SortDirection = 'asc' | 'desc';

const createIdFromSelfLink = (selfHref?: string) => {
  if (!selfHref) return crypto.randomUUID();
  return selfHref.substring(selfHref.lastIndexOf('/') + 1);
};

const toCustomerOption = (customer: CustomerDto): CustomerOption => ({
  ...customer,
  id: createIdFromSelfLink(customer._links?.self?.href),
});

const TrainingsPage = () => {
  const [trainings, setTrainings] = useState<TrainingRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [trainingForm, setTrainingForm] = useState({
    customerHref: '',
    activity: '',
    duration: 60,
    date: '',
  });
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [isTrainingSubmitting, setIsTrainingSubmitting] = useState(false);
  const [trainingActionError, setTrainingActionError] = useState<string | null>(null);
  const [deletingTrainingId, setDeletingTrainingId] = useState<string | null>(null);

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

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await fetchCustomers();
        setCustomers(data.map(toCustomerOption));
      } catch (err) {
        console.error(err);
        setCustomersError('Failed to load customers.');
      }
    };

    loadCustomers();
  }, []);

  useEffect(() => {
    if (!trainingForm.customerHref && customers.length > 0) {
      const firstHref = customers[0]._links?.self?.href;
      if (firstHref) {
        setTrainingForm((prev) => ({
          ...prev,
          customerHref: firstHref,
        }));
      }
    }
  }, [customers, trainingForm.customerHref]);

  const handleTrainingInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setTrainingForm((prev) => ({
      ...prev,
      [name]: name === 'duration' ? Number(value) : value,
    }));
  };

  const handleTrainingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTrainingError(null);
    if (!trainingForm.customerHref) {
      setTrainingError('Select a customer for the training.');
      return;
    }
    if (!trainingForm.date) {
      setTrainingError('Select date and time for the training.');
      return;
    }

    try {
      setIsTrainingSubmitting(true);
      const isoDate = new Date(trainingForm.date).toISOString();
      await createTraining({
        activity: trainingForm.activity,
        duration: Number(trainingForm.duration),
        date: isoDate,
        customer: trainingForm.customerHref,
      });
      setTrainingForm((prev) => ({
        ...prev,
        activity: '',
        duration: 60,
        date: '',
      }));
      const refreshed = await fetchTrainings();
      setTrainings(
        refreshed.map((training) => ({
          ...training,
          id: createIdFromSelfLink(training._links?.self?.href),
        }))
      );
    } catch (err) {
      console.error(err);
      setTrainingError('Failed to add training.');
    } finally {
      setIsTrainingSubmitting(false);
    }
  };

  const handleDeleteTraining = async (training: TrainingRow) => {
    setTrainingActionError(null);
    const trainingName = training.activity || 'this training';
    const confirmed = window.confirm(
      `Delete ${trainingName} for ${
        training.customer
          ? `${training.customer.firstname} ${training.customer.lastname}`
          : 'selected customer'
      }? This action cannot be undone.`
    );

    if (!confirmed) return;

    const trainingLink = training._links?.self?.href ?? training._links?.training?.href;
    if (!trainingLink) {
      setTrainingActionError('Cannot delete training without a valid link.');
      return;
    }

    try {
      setDeletingTrainingId(training.id);
      await deleteTraining(trainingLink);
      setTrainings((prev) => prev.filter((item) => item.id !== training.id));
    } catch (err) {
      console.error(err);
      setTrainingActionError('Failed to delete training.');
    } finally {
      setDeletingTrainingId(null);
    }
  };

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

      <form className="training-form" onSubmit={handleTrainingSubmit}>
        <h2>Add new training</h2>
        <div className="training-form__grid">
          <label htmlFor="training-customer">
            Customer
            <select
              id="training-customer"
              name="customerHref"
              value={trainingForm.customerHref}
              onChange={handleTrainingInputChange}
              required
            >
              {customers.map((customer) => {
                const href = customer._links?.self?.href;
                if (!href) return null;
                return (
                  <option key={customer.id} value={href}>
                    {customer.firstname} {customer.lastname}
                  </option>
                );
              })}
            </select>
          </label>
          <label htmlFor="training-activity">
            Activity
            <input
              id="training-activity"
              name="activity"
              value={trainingForm.activity}
              onChange={handleTrainingInputChange}
              required
            />
          </label>
          <label htmlFor="training-duration">
            Duration (minutes)
            <input
              id="training-duration"
              name="duration"
              type="number"
              min={5}
              step={5}
              value={trainingForm.duration}
              onChange={handleTrainingInputChange}
              required
            />
          </label>
          <label htmlFor="training-date">
            Date & time
            <input
              id="training-date"
              name="date"
              type="datetime-local"
              value={trainingForm.date}
              onChange={handleTrainingInputChange}
              required
            />
          </label>
        </div>
        {trainingError && (
          <p className="training-form__error" role="alert">
            {trainingError}
          </p>
        )}
        {customersError && <p>{customersError}</p>}
        <div className="training-form__actions">
          <button type="submit" disabled={isTrainingSubmitting || customers.length === 0}>
            {isTrainingSubmitting ? 'Saving…' : 'Save training'}
          </button>
        </div>
      </form>

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
      {trainingActionError && (
        <p className="training-form__error" role="alert">
          {trainingActionError}
        </p>
      )}

      {!isLoading && !error && (
        <div className="table-wrapper">
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
                <th>Actions</th>
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
                  <td>
                    <button
                      type="button"
                      onClick={() => handleDeleteTraining(training)}
                      disabled={deletingTrainingId === training.id}
                    >
                      {deletingTrainingId === training.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default TrainingsPage;

