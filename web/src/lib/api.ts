const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

type Json = Record<string, unknown>;

async function parseJson(response: Response) {
  let data: any;
  try {
    data = await response.json();
  } catch {
    return {};
  }
  // The API's error contract is inconsistent: the auth/team controllers
  // return `{ error: "..." }` while the task controller returns
  // `{ message: "..." }`. Every page reads `.message`, which meant real
  // API errors ("Invalid credentials", "Email already registered") were
  // silently swallowed and replaced with generic fallbacks. Normalize
  // here, in the one place all responses pass through.
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "error" in data &&
    !("message" in data)
  ) {
    return { ...data, message: data.error };
  }
  return data;
}

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  return parseJson(response);
};

export const createTask = async (teamId: string, taskData: Json, token: string) => {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  });
  return parseJson(response);
};

export const updateTask = async (taskId: string, taskData: Json, token: string) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  });
  return parseJson(response);
};

export const deleteTask = async (taskId: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseJson(response);
};

export const getTeams = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/teams`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseJson(response);
};

export const getTeam = async (teamId: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseJson(response);
};

export const getTasksForTeam = async (teamId: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}/tasks`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseJson(response);
};

export const signup = async (name: string, email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });
  return parseJson(response);
};

export const createTeam = async (name: string, token: string) => {
  const response = await fetch(`${API_BASE_URL}/teams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  return parseJson(response);
};
