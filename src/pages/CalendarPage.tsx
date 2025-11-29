import { useEffect, useState, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import type { View, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import dayjs from 'dayjs';
import { fetchTrainings } from '../services/personalTrainerApi';
import type { TrainingDto } from '../services/personalTrainerApi';

moment.locale('fi');

const localizer = momentLocalizer(moment);

type CalendarEvent = Event & {
  training: TrainingDto;
};

const CalendarPage = () => {
  const [trainings, setTrainings] = useState<TrainingDto[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('week');
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

  const events: CalendarEvent[] = useMemo(() => {
    return trainings.map((training) => {
      const start = new Date(training.date);
      const end = dayjs(training.date).add(training.duration, 'minute').toDate();
      const customerName = training.customer
        ? `${training.customer.firstname} ${training.customer.lastname}`
        : 'Unknown';

      return {
        id: training._links?.self?.href || crypto.randomUUID(),
        title: `${training.activity} / ${customerName}`,
        start,
        end,
        training,
      };
    });
  }, [trainings]);

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const goToPrevious = () => {
    if (view === 'week') {
      setCurrentDate(dayjs(currentDate).subtract(1, 'week').toDate());
    } else if (view === 'month') {
      setCurrentDate(dayjs(currentDate).subtract(1, 'month').toDate());
    } else {
      setCurrentDate(dayjs(currentDate).subtract(1, 'day').toDate());
    }
  };

  const goToNext = () => {
    if (view === 'week') {
      setCurrentDate(dayjs(currentDate).add(1, 'week').toDate());
    } else if (view === 'month') {
      setCurrentDate(dayjs(currentDate).add(1, 'month').toDate());
    } else {
      setCurrentDate(dayjs(currentDate).add(1, 'day').toDate());
    }
  };

  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: '#2196f3',
        borderColor: '#1976d2',
        color: '#fff',
        borderRadius: '4px',
        border: 'none',
      },
    };
  };

  if (isLoading) {
    return (
      <section className="calendar-page">
        <p>Loading trainings…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="calendar-page">
        <p>{error}</p>
      </section>
    );
  }

  return (
    <section className="calendar-page">
      <header className="calendar-header">
        <div className="calendar-nav">
          <button type="button" onClick={() => setCurrentDate(new Date())}>
            Today
          </button>
          <button type="button" onClick={goToPrevious}>
            Back
          </button>
          <button type="button" onClick={goToNext}>
            Next
          </button>
        </div>
        <div className="calendar-date-range">
          {view === 'month'
            ? dayjs(currentDate).format('MMMM YYYY')
            : view === 'week'
              ? `${dayjs(currentDate).startOf('week').format('MMMM D')} - ${dayjs(currentDate).endOf('week').format('D')}`
              : dayjs(currentDate).format('MMMM D, YYYY')}
        </div>
        <div className="calendar-view-switcher">
          <button
            type="button"
            className={view === 'month' ? 'active' : ''}
            onClick={() => setView('month')}
          >
            Month
          </button>
          <button
            type="button"
            className={view === 'week' ? 'active' : ''}
            onClick={() => setView('week')}
          >
            Week
          </button>
          <button
            type="button"
            className={view === 'day' ? 'active' : ''}
            onClick={() => setView('day')}
          >
            Day
          </button>
        </div>
      </header>

      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '70vh' }}
          view={view}
          onView={handleViewChange}
          date={currentDate}
          onNavigate={handleNavigate}
          views={['month', 'week', 'day']}
          eventPropGetter={eventStyleGetter}
          culture="fi"
          messages={{
            next: 'Next',
            previous: 'Back',
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
            agenda: 'Agenda',
            date: 'Date',
            time: 'Time',
            event: 'Event',
            noEventsInRange: 'No trainings in this range.',
          }}
        />
      </div>
    </section>
  );
};

export default CalendarPage;
