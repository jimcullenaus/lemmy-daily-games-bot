import { DateTime } from 'luxon';
import DateFormattingService from './date-formatting-service';
import DayNumberService from './day-number-service';
import { GameConfig } from '../config/games';

export default class TitleService {
    private _dateService : DateFormattingService;
    private _dayNumberService : DayNumberService;

    private _timezone : string;

    constructor(timezone : string) {
        this._timezone = timezone;
        this._dateService = new DateFormattingService();
        this._dayNumberService = new DayNumberService(this._timezone);
    }

    public getTitle(gameConfig: GameConfig) : string {
        const today = DateTime.now().setZone(this._timezone).startOf("day");
        const date = this._dateService.getDate(today);
        const number = this._dayNumberService.calculateDayNumber(today, gameConfig.startDate);
        return `${gameConfig.titlePrefix} #${number} ${date}`;
    }
}
