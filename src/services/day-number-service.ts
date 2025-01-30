import { DateTime } from 'luxon';

export default class DayNumberService {
    private _timezone : string;

    constructor(timezone : string) {
        this._timezone = timezone;
    }

    calculateDayNumber(inputDate : DateTime) : number {
        const msPerDay = 1000 * 60 * 60 * 24;

        // Compute the start date (Day 1)
        const startDate = DateTime.fromISO("2023-06-12", { zone: this._timezone }).startOf("day");

        // Calculate the difference in days between inputDate and startDate
        const diffInDays = inputDate.diff(startDate, "days").days;
        // const diffInMs = inputDate.getTime() - startDate.getTime();
        // const diffInDays = Math.floor(diffInMs / msPerDay);

        return diffInDays + 1; // Adding 1 because Day 1 corresponds to startDate
    }
}
