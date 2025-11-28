import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { fetchCustomers, createCustomer } from '../services/personalTrainerApi';
import type { CustomerDto, CreateCustomerPayload } from '../services/personalTrainerApi';

type CustomerRow = CustomerDto & { id: string };

const createIdFromSelfLink = (selfHref?: string) => {
  if (!selfHref) return crypto.randomUUID();
  return selfHref.substring(selfHref.lastIndexOf('/') + 1);
};

type SortKey = 'name' | 'email' | 'city' | 'streetaddress';
type SortDirection = 'asc' | 'desc';

const toCustomerRow = (customer: CustomerDto): CustomerRow => ({
  ...customer,
  id: createIdFromSelfLink(customer._links?.self?.href),
});

const CustomersPage = () => {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const initialFormState: CreateCustomerPayload = {
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    streetaddress: '',
    postcode: '',
    city: '',
  };
  const [formValues, setFormValues] = useState<CreateCustomerPayload>(initialFormState);

  const loadCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchCustomers();
      setCustomers(data.map(toCustomerRow));
    } catch (err) {
      console.error(err);
      setError('Failed to load customers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    try {
      setIsSubmitting(true);
      const createdCustomer = await createCustomer(formValues);
      setFormValues(initialFormState);
      if (createdCustomer) {
        setCustomers((prev) => [...prev, toCustomerRow(createdCustomer)]);
      } else {
        await loadCustomers();
      }
    } catch (err) {
      console.error(err);
      setFormError('Failed to add customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const term = search.toLowerCase();
    return customers.filter((customer) =>
      [
        customer.firstname,
        customer.lastname,
        customer.email,
        customer.city,
        customer.streetaddress,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term))
    );
  }, [customers, search]);

  const sortedCustomers = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'email':
          return a.email.localeCompare(b.email) * direction;
        case 'city':
          return a.city.localeCompare(b.city) * direction;
        case 'streetaddress':
          return a.streetaddress.localeCompare(b.streetaddress) * direction;
        case 'name':
        default: {
          const nameA = `${a.firstname} ${a.lastname}`.trim();
          const nameB = `${b.firstname} ${b.lastname}`.trim();
          return nameA.localeCompare(nameB) * direction;
        }
      }
    });
  }, [filtered, sortDirection, sortKey]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const renderSortHint = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <section>
      <header>
        <h1>Customers</h1>
        <p>Manage your customer base.</p>
      </header>

      <form className="customer-form" onSubmit={handleSubmit}>
        <h2>Add new customer</h2>
        <div className="customer-form__grid">
          <label htmlFor="firstname">
            First name
            <input
              id="firstname"
              name="firstname"
              value={formValues.firstname}
              onChange={handleInputChange}
              required
            />
          </label>
          <label htmlFor="lastname">
            Last name
            <input
              id="lastname"
              name="lastname"
              value={formValues.lastname}
              onChange={handleInputChange}
              required
            />
          </label>
          <label htmlFor="email">
            Email
            <input
              id="email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleInputChange}
              required
            />
          </label>
          <label htmlFor="phone">
            Phone
            <input
              id="phone"
              name="phone"
              value={formValues.phone}
              onChange={handleInputChange}
              required
            />
          </label>
          <label htmlFor="streetaddress">
            Street address
            <input
              id="streetaddress"
              name="streetaddress"
              value={formValues.streetaddress}
              onChange={handleInputChange}
              required
            />
          </label>
          <label htmlFor="postcode">
            Postcode
            <input
              id="postcode"
              name="postcode"
              value={formValues.postcode}
              onChange={handleInputChange}
              required
            />
          </label>
          <label htmlFor="city">
            City
            <input
              id="city"
              name="city"
              value={formValues.city}
              onChange={handleInputChange}
              required
            />
          </label>
        </div>
        {formError && (
          <p className="customer-form__error" role="alert">
            {formError}
          </p>
        )}
        <div className="customer-form__actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save customer'}
          </button>
        </div>
      </form>

      <div>
        <label htmlFor="customer-search">Search customers</label>
        <input
          id="customer-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Name, email, city..."
        />
      </div>

      {isLoading && <p>Loading customers…</p>}
      {error && <p>{error}</p>}

      {!isLoading && !error && (
        <table>
          <thead>
            <tr>
              <th>
                <button type="button" onClick={() => toggleSort('name')}>
                  Name{renderSortHint('name')}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => toggleSort('email')}>
                  Email{renderSortHint('email')}
                </button>
              </th>
              <th>Phone</th>
              <th>
                <button type="button" onClick={() => toggleSort('streetaddress')}>
                  Address{renderSortHint('streetaddress')}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => toggleSort('city')}>
                  City{renderSortHint('city')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCustomers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  {customer.firstname} {customer.lastname}
                </td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td>{customer.streetaddress}</td>
                <td>{customer.city}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default CustomersPage;

