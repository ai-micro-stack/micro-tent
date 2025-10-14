export type Role = {
  id: number;
  role: string
};

export type User = {
  readonly uuid: string;
  username: string;
  fullname: string;
  email: string;
  role_id: number;
  readonly createdDate: Date;
  active: boolean;
  password?: string;
};

export const emptyUser: User = {
  uuid: "",
  username: "",
  fullname: "",
  email: "",
  role_id: 0,
  createdDate: new Date(),
  active: false,
  password: "",
};

export type Credential = {
  username: string;
  password: string;
};
