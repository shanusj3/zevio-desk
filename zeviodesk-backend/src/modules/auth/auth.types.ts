export interface LoginDto {
  email: string;
  password?: string;
}


export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
  };
  accessToken: string;
  refreshToken?: string;
}
