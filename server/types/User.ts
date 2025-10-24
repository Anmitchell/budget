export interface User {
    id: number;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
    createdAt: Date;
    updatedAt: Date;
}