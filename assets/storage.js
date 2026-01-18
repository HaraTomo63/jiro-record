const STORAGE_KEY = "jirolog:v2";

const defaultState = {
  communityRecords: [],
  personalRecords: [],
  user: null,
  skipAuth: false,
  selectedShop: "",
};

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const normalizeState = (raw) => {
  if (Array.isArray(raw)) {
    return { ...defaultState, communityRecords: raw };
  }
  if (!raw || typeof raw !== "object") {
    return { ...defaultState };
  }
  return {
    ...defaultState,
    ...raw,
    communityRecords: Array.isArray(raw.communityRecords) ? raw.communityRecords : [],
    personalRecords: Array.isArray(raw.personalRecords) ? raw.personalRecords : [],
  };
};

const loadState = () => {
  const raw = safeParse(localStorage.getItem(STORAGE_KEY));
  return normalizeState(raw);
};

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadCommunity = () => loadState().communityRecords;
export const loadPersonal = () => loadState().personalRecords;

export const upsertRecord = (type, record) => {
  const state = loadState();
  const key = type === "personal" ? "personalRecords" : "communityRecords";
  const records = [...state[key]];
  const index = records.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.unshift(record);
  }
  state[key] = records;
  saveState(state);
  return records;
};

export const removeRecord = (type, id) => {
  const state = loadState();
  const key = type === "personal" ? "personalRecords" : "communityRecords";
  state[key] = state[key].filter((item) => item.id !== id);
  saveState(state);
  return state[key];
};

export const getById = (type, id) => {
  const records = type === "personal" ? loadPersonal() : loadCommunity();
  return records.find((item) => item.id === id) || null;
};

export const getUser = () => loadState().user;

export const setUser = (user) => {
  const state = loadState();
  state.user = user;
  saveState(state);
};

export const getSkipAuth = () => loadState().skipAuth;

export const setSkipAuth = (value) => {
  const state = loadState();
  state.skipAuth = value;
  saveState(state);
};

export const getSelectedShop = () => loadState().selectedShop || "";

export const setSelectedShop = (shop) => {
  const state = loadState();
  state.selectedShop = shop;
  saveState(state);
};
