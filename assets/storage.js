const STORAGE_KEY = "jirolog:v1";

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return [];
  }
};

export const loadAll = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  const records = raw ? safeParse(raw) : [];
  return Array.isArray(records) ? records : [];
};

export const saveAll = (records) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const upsert = (record) => {
  const records = loadAll();
  const index = records.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.unshift(record);
  }
  saveAll(records);
  return records;
};

export const remove = (id) => {
  const records = loadAll().filter((item) => item.id !== id);
  saveAll(records);
  return records;
};

export const getById = (id) => {
  const records = loadAll();
  return records.find((item) => item.id === id) || null;
};
