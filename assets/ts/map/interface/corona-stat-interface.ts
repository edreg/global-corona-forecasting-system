import {CountryInterface} from "./country-interface";

export interface CoronaStatInterface {

    date: string;

    country: CountryInterface;

    amountTotal: number;
    amountInfected: number;
    amountHealed: number;
    amountDeath: number;

    amountTotalTheDayBefore: number;
    amountInfectedTheDayBefore: number;
    amountHealedTheDayBefore: number;
    amountDeathTheDayBefore: number;

    doublingTotalRate: number;
    doublingInfectionRate: number;
    doublingHealedRate: number;
    doublingDeathRate: number;
}