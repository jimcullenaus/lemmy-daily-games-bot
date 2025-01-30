import { DateTime } from 'luxon';

export default class DateFormattingService {
    public getDate(date : DateTime) : string {
        const dateString = date.toISODate();
        if (dateString) {
            return dateString;
        }

        throw new Error('Unable to convert date.');
    }
}
