const fetchLeads = async () => {
  const token =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjhjYjlhODJiMjkyNzZjZjI2NjJiYTgwYTI1ZjQ0YTM0ZDJiMDVjOWU4NTg4ZTI3NTk0ODMzNWVhM2Y1NGY4Y2YzODkyYmFlNDVjNDQ1MDRjIn0.eyJhdWQiOiJjNTFiNTg4Ny03OTMyLTQxYTctYTI1Ny0wZjgzZGZkYTY3MDkiLCJqdGkiOiI4Y2I5YTgyYjI5Mjc2Y2YyNjYyYmE4MGEyNWY0NGEzNGQyYjA1YzllODU4OGUyNzU5NDgzMzVlYTNmNTRmOGNmMzg5MmJhZTQ1YzQ0NTA0YyIsImlhdCI6MTcwOTM5NDU3MCwibmJmIjoxNzA5Mzk0NTcwLCJleHAiOjE3MDk1OTY4MDAsInN1YiI6IjEwNzI2Mjk0IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMxNTk1NTAyLCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iXSwiaGFzaF91dWlkIjoiNTNlMmJmYmItNWI5Zi00MDgwLTgwY2YtOGMxNzVjMzRhN2IxIn0.Wb8m5ExwsD_dj6f1S-MDrAcAo92Aos8w38VKfIBi6C5B9uVCT0fJ2n0NXofVfBBbalQDNi9lFX6f3xVBBEpZhmGmhQ5qrGLEgVN8u-zaeTsUMwkB4CaKdx4XdGZy01NfeKqXqUH6MmBvyqHK8ZONh8L_I3u0PR8hD8M4hEfZa_bF9wATDj7C-MSCPjasOVxvtmoH7awksmyvTexX8PmT3dtV0qPgkgLlF9VxzJ6kaLsYfQPULOXJcHeff-38MI2CpYq6g53VV6-aFtF0jKOGgIBYQIYGkAYzsKNFiqrCmci-a_deNmy1pL4QSJ5WKk4nh53v7tczgSmWpbXELWJwEw";

  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  });

  const proxyURL = "https://corsproxy.io/?";
  const apiURL = "https://madliani.amocrm.ru/api/v4/leads";
  const url = proxyURL + encodeURIComponent(apiURL);

  const request = new Request(url, {
    credentials: "omit",
    headers,
    method: "GET",
  });

  let data = [];

  try {
    const response = await fetch(request);
    const json = await response.json();
    const { leads } = json["_embedded"];

    data = leads.map(({ name, price, created_at, updated_at }) => {
      const createdAt = new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(created_at));
      const updatedAt = new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(updated_at));

      return [name, price, createdAt, updatedAt, null];
    });
  } catch (exception) {
    console.error(exception);
  }

  return data;
};

window.onload = async () => {
  const columns = [
    { title: "Название" },
    {
      title: "Бюджет",
    },
    {
      title: "Дата и время создания",
    },
    {
      title: "Дата и время изменения",
    },
    {
      title: "Ответственые",
    },
  ];

  const data = await fetchLeads();

  const url = "https://cdn.datatables.net/plug-ins/2.0.1/i18n/ru.json";

  const language = {
    url,
  };

  $("#table").DataTable({
    columns,
    data,
    language,
  });
};
