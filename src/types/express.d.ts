export {};

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      fullName: string;
      accountType: string;
      avatar: string;
      roles: Array<{ role: { name: string } }>;
    }
  }
}
