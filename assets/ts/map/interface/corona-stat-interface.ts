import {CountryInterface} from "./country-interface";

export interface CoronaStatInterface {
    date: string;
    country: CountryInterface;
    amountTotal: number;
    amountInfected: number;
    amountHealed: number;
    amountDeath: number;
    amountTotalTheDayBefore: number;
    amountHealedTheDayBefore: number;
    amountDeathTheDayBefore: number;
    doublingInfectionRate: number;
    doublingDeathRate: number;
    doublingHealedRate: number;
}