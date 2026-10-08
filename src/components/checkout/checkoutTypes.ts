export interface ShippingDetails {
    fullName: string;
    email: string;
    phone: string;
    province: string;
    canton: string;
    address: string;
    deliveryNotes: string;
}

export type ShippingFieldErrors = Partial<
    Record<keyof ShippingDetails, string>
>;

export const INITIAL_SHIPPING_DETAILS: ShippingDetails = {
    fullName: '',
    email: '',
    phone: '',
    province: '',
    canton: '',
    address: '',
    deliveryNotes: ''
};

export const COSTA_RICAN_PROVINCES = [
    'San José',
    'Alajuela',
    'Cartago',
    'Heredia',
    'Guanacaste',
    'Puntarenas',
    'Limón'
] as const;