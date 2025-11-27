interface EsgReport {
    car_band: string;
    car_color: string;
    car_infocode: string;
    car_remarks: string;
    car_tier: string;
    mile: number;
    oil: number;
    rateoil: number;
}

interface ESGFilter {
    car_infocode: OptionEntity[];
    car_band: OptionEntity[];
    car_tier: OptionEntity[];
    car_color: OptionEntity[];
}