import { useEffect, useMemo, useState } from 'react';
import { fetchCustomers } from '../services/personalTrainerApi';
import type { CustomerDto } from '../services/personalTrainerApi';

type CustomerRow = CustomerDto & { id: string };

const createIdFromSelfLink = (selfHref?: string) => {
  if (!selfHref) return crypto.randomUUID();
  return selfHref.substring(selfHref.lastIndexOf('/') + 1);
};

const CustomersPage = () => {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCustomers();
        setCustomers(
          data.map((customer) => ({
            ...customer,
            id: createIdFromSelfLink(customer._links?.self?.href),
          }))
        );
      } catch (err) {
        console.error(err);
        setError('Failed to load customers.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

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

  return (
    <section>
      <header>
        <h1>Customers</h1>
        <p>Manage your customer base.</p>
      </header>

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
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr key={customer.id}>
                <td>
                  {customer.firstname} {customer.lastname}
                </td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td>
                  {customer.streetaddress}, {customer.postcode} {customer.city}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default CustomersPage;

