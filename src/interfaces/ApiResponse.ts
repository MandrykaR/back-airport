export interface ApiResponse<Data = any> {
    data?: Data;
    success: boolean;
    faultString?: string;
    faultCode?: number;
}
