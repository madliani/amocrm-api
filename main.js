const fromUnix = (timestamp) => {
  const locale = "ru-RU";

  const options = {
    dateStyle: "short",
    timeStyle: "short",
  };

  return new Intl.DateTimeFormat(locale, options).format(
    new Date(timestamp * 1_000)
  );
};

const fetchJWT = async (refreshToken) => {
  const proxyUrl = "https://corsproxy.io/?";
  const apiUrl = "https://madliani.amocrm.ru/oauth2/access_token";
  const url = proxyUrl + encodeURIComponent(apiUrl);

  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  const request = new Request(url, {
    body: JSON.stringify({
      client_id: "c51b5887-7932-41a7-a257-0f83dfda6709",
      client_secret:
        "V3h1nkaZAHQClsMUap47bDl6k6UWpesopyNRVAM5g1pXwnwwac4A3RKFYTnE02pC",
      grant_type: "refresh_token",
      redirect_uri: "https://madliani.github.io",
      refresh_token: refreshToken,
    }),
    credentials: "omit",
    headers,
    method: "POST",
  });

  const response = await fetch(request);
  const { access_token, refresh_token } = await response.json();

  return { accessToken: access_token, refreshToken: refresh_token };
};

const fetchResponsibleUser = async (token, id) => {
  const proxyURL = "https://corsproxy.io/?";
  const apiURL = `https://madliani.amocrm.ru/api/v4/users/${id}`;
  const url = proxyURL + encodeURIComponent(apiURL);

  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  });

  const request = new Request(url, {
    credentials: "omit",
    headers,
    method: "GET",
  });

  const response = await fetch(request);

  return await response.json();
};

const fetchLead = async (token, lead) => {
  const { created_at, name, price, responsible_user_id, updated_at } = lead;

  const createdAt = fromUnix(created_at);
  const updatedAt = fromUnix(updated_at);

  const responsibleUser = await fetchResponsibleUser(
    token,
    responsible_user_id
  );

  return [name, price, createdAt, updatedAt, responsibleUser?.name];
};

const fetchLeads = async (token, page = 1, limit = 250) => {
  const proxyUrl = "https://corsproxy.io/?";
  const apiUrl = `https://madliani.amocrm.ru/api/v4/leads?order[name]=asc&order[price]=asc&page=${page}&limit=${limit}`;
  const url = proxyUrl + encodeURIComponent(apiUrl);

  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  });

  const request = new Request(url, {
    credentials: "omit",
    headers,
    method: "GET",
  });

  try {
    const response = await fetch(request);
    const json = await response.json();
    const { leads } = json["_embedded"];

    const data = await Promise.all(
      leads.map(async (lead) => await fetchLead(token, lead))
    );

    return data;
  } catch (exception) {
    console.error(exception);
  }

  return [];
};

const fetchAllLeads = async (token) => {
  let chunk = [];
  let data = [];
  let page = 1;

  do {
    const throttledAFetchLeads = _.throttle(fetchLeads, 2_000);

    chunk = await throttledAFetchLeads(token, page, 5);
    data = [...data, ...chunk];

    page++;
  } while (chunk.length);

  return data;
};

const lengthChange = async (table, length, accessToken) => {
  let data = [];

  if (length === -1) {
    data = await fetchAllLeads(accessToken);
  } else {
    data = await fetchLeads(accessToken, 1, length);
  }

  table.clear();
  table.rows.add(data).draw();
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

  const refreshToken =
    "def50200e132fc893b01defbbfe64bfe6884ddbda2c08ab383c6238beb8acf6d9fa0b8ddc8745bf3edbace8951cc598f683a8eec6d052f2f3baf5e1c1a5bc742e36c7a9a3c00a6d3ef2ac42895ca94df5c8aa18bd0c0b012737875dd78d2cc37b4dd848477b5cb8cf4283357d1331758eb50f5c84b41ad09dd8a7dab1381e6362e4112927ef072e69a6b575aa0138ff207015aa7f43a8258d42715e46fdf4bf86909c8b81d7ec371a4a6f4ab1c486ec50d6c229c5239c8ef81dcdec997a369248c3409d48642f9506a59ce2a4e4c93bba8848336167327300309aa3013ad950abaaa4cbc679aa7895ccb97c970ae2c3da2aca62732170d0ebdfb57965630c4d38a2067836d8e682c46baff939f11c771787ca23f829374ca13705035279b293d6d3834f7bfd4921cfa25764eeb8936122fcab97c76ea37495f83037864b153ef04d88478184550dfc5fa9a58d730a12caa581932ba87523816a0e9bc87d0b868e2ff793508590b467b808175f113eea5f1508eedfb1a716acb24dd0d238991846edce4bdc94078d6c05267996a7b506cccd07b0c7b08a3b3d35ccc71b578618c52da185e03f64c5a9fb41ce59e2fe64146c0";

  const { accessToken } = await fetchJWT(refreshToken);
  const data = await fetchAllLeads(accessToken);

  const url = "https://cdn.datatables.net/plug-ins/2.0.1/i18n/ru.json";

  const language = {
    url,
  };

  const lengthMenu = [{ label: "Все", value: -1 }, 2, 5, 10];
  const ordering = false;

  const table = $("#table").DataTable({
    columns,
    data,
    language,
    lengthMenu,
    ordering,
  });

  table.on(
    "length",
    async (_event, _settings, length) =>
      await lengthChange(table, length, accessToken)
  );
};
