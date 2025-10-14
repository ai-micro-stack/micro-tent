export type moduleRole = {
  id: number;
  role: string;
  disabled?: boolean;
};

export type moduleType = {
  moduleName: string;
  moduleRoles: moduleRole[];
  moduleStatus: number;
  compatibility?: string[] | null;
};

export const defaultRoles: moduleRole[] = [{ id: 0, role: "(None)" }];
