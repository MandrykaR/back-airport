export interface RegistrationRequest {
    email: string;
    password: string;
    fullName: string;
}

export interface RegistrationResponse {
    message: string;
    token: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    message: string;
}

export interface PingResponse {
    token: string;
}
