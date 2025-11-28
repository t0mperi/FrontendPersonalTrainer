const API_BASE_URL =
  'https://customer-rest-service-frontend-personaltrainer.2.rahtiapp.fi/api';

export type CustomerDto = {
  firstname: string;
  lastname: string;
  streetaddress: string;
  postcode: string;
  city: string;
  email: string;
  phone: string;
  _links: {
    self: { href: string };
    trainings?: { href: string };
  };
};

type CustomersResponse = {
  _embedded?: {
    customers?: CustomerDto[];
  };
};

export const fetchCustomers = async (): Promise<CustomerDto[]> => {
  const response = await fetch(`${API_BASE_URL}/customers`);

  if (!response.ok) {
    throw new Error(`Failed to fetch customers: ${response.statusText}`);
  }

  const data = (await response.json()) as CustomersResponse;
  return data._embedded?.customers ?? [];
};

export type CreateCustomerPayload = {
  firstname: string;
  lastname: string;
  streetaddress: string;
  postcode: string;
  city: string;
  email: string;
  phone: string;
};

export const createCustomer = async (
  payload: CreateCustomerPayload
): Promise<CustomerDto | undefined> => {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create customer: ${response.statusText}`);
  }

  try {
    return (await response.json()) as CustomerDto;
  } catch {
    // Some endpoints respond with empty body on success; fall back to undefined.
    return undefined;
  }
};

export const updateCustomer = async (
  customerUrl: string,
  payload: CreateCustomerPayload
): Promise<CustomerDto | undefined> => {
  const response = await fetch(customerUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to update customer: ${response.statusText}`);
  }

  try {
    return (await response.json()) as CustomerDto;
  } catch {
    return undefined;
  }
};

export const deleteCustomer = async (customerUrl: string): Promise<void> => {
  const response = await fetch(customerUrl, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete customer: ${response.statusText}`);
  }
};

type TrainingResource = {
  date: string;
  duration: number;
  activity: string;
  _links: {
    self: { href: string };
    training: { href: string };
    customer?: { href: string };
  };
};

export type TrainingDto = TrainingResource & {
  customer?: CustomerDto;
};

export type CreateTrainingPayload = {
  date: string;
  duration: number;
  activity: string;
  customer: string;
};

type TrainingsResponse = {
  _embedded?: {
    trainings?: TrainingDto[];
  };
};

export const fetchTrainings = async (): Promise<TrainingDto[]> => {
  const response = await fetch(`${API_BASE_URL}/trainings`);

  if (!response.ok) {
    throw new Error(`Failed to fetch trainings: ${response.statusText}`);
  }

  const data = (await response.json()) as TrainingsResponse;
  const trainings = data._embedded?.trainings ?? [];
  const customerCache = new Map<string, CustomerDto | null>();

  const trainingsWithCustomers = await Promise.all(
    trainings.map(async (training) => {
      const customerLink = training._links.customer?.href;
      if (!customerLink) {
        return training;
      }

      if (!customerCache.has(customerLink)) {
        try {
          const customerResponse = await fetch(customerLink);
          if (!customerResponse.ok) {
            throw new Error();
          }
          const customerData = (await customerResponse.json()) as CustomerDto;
          customerCache.set(customerLink, customerData);
        } catch {
          customerCache.set(customerLink, null);
        }
      }

      return {
        ...training,
        customer: customerCache.get(customerLink) ?? undefined,
      };
    })
  );

  return trainingsWithCustomers;
};

export const createTraining = async (
  payload: CreateTrainingPayload
): Promise<TrainingDto | undefined> => {
  const response = await fetch(`${API_BASE_URL}/trainings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create training: ${response.statusText}`);
  }

  try {
    return (await response.json()) as TrainingDto;
  } catch {
    return undefined;
  }
};

