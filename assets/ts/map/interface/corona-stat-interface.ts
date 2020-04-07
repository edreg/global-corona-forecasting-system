import {CountryInterface} from "./country-interface";

export class CoronaStatInterface {

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

    static getPercentageValueToDayBefore(value: number, valueTheDayBefore: number)
    {
        return Math.min(100, (100 * (value - valueTheDayBefore) / Math.max(1, value)));
    }

    static getDoublingRate(value: number, valueTheDayBefore: number): number {
        let doublingRate = 0;

        if (valueTheDayBefore > 0 && value > 0) {
            let log = Math.log(value / valueTheDayBefore);
            if (log !== 0) {
                doublingRate = Math.log(2) / log;
            }
        }

        return doublingRate;
    }
}