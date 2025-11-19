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

export type TrainingDto = {
  date: string;
  duration: number;
  activity: string;
  customer?: CustomerDto;
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
  return data._embedded?.trainings ?? [];
};

