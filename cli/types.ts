export type RepayVoucherInformation = {
    startTime: string;
    endTime: string;
    discountPercentage: number;
    maximumAmount: number;
    images: string;
} & MetadataInformation;

export type MetadataInformation = {
    name: string;
    symbol: string;
    description: string;
    uri: string;
};
