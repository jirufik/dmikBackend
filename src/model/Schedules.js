import pathExists from 'jrf-path-exists'
import processRowSchedule from "../utils/processRowSchedule";
import moment from 'moment'
import processSchedule from "../utils/processSchedule";

export default class Schedules {

  constructor({postgres}) {

    this.postgres = postgres;

  }

  async get({filter}) {

    if (!this.postgres) throw new Error('Not initialized postgres');

    const strWhere = [];
    let valueNumber = 0;
    const values = [];

    const hallIds = filter.hallIds;
    const ticketIds = filter.ticketIds;
    const offset = typeof filter.offset === 'number' && filter.offset;
    const limit = typeof filter.limit === "number" && filter.limit;
    const plusOne = Boolean(filter.plusOne);
    let dateStart = null;
    let dateEnd = null;

    if (filter.dateStart) dateStart = moment(filter.dateStart);
    if (filter.dateEnd) dateEnd = moment(filter.dateEnd);

    if (Array.isArray(hallIds) && hallIds.length) {
      strWhere.push(`s.id_hall = ANY ($${++valueNumber}::integer[])`);
      values.push(hallIds);
    }

    if (Array.isArray(ticketIds) && ticketIds.length) {
      strWhere.push(`s.id_ticket = ANY ($${++valueNumber}::integer[])`);
      values.push(ticketIds);
    }

    if (dateStart) {
      strWhere.push(`DATE(s.date) >= DATE($${++valueNumber})`);
      values.push(dateStart.format('YYYY-MM-DD'));
    }

    if (dateEnd) {
      strWhere.push(`DATE(s.date) <= DATE($${++valueNumber})`);
      values.push(dateEnd.format('YYYY-MM-DD'));
    }

    let text = `select f.code, f.name, f.age, f.img, f.runtime, 
       s.date as date_time, s.cost, DATE(s."date") as date, s.id_hall, s.id_ticket, 
       t."name" as ticket_name, t.description as ticket_description,
       h."name" as hall_name, h.description as hall_description
      from schedules s
      left join films f
      on s.code_film = f.code
      left join tickets t
      on s.id_ticket = t.id
      left join halls h
      on s.id_hall = h.id
`;
    text += strWhere.length ? ` WHERE ${strWhere.join(' AND ')}` : '';
    text += ` order by date, h.id, date_time, s.cost`;

    if (limit) text += ` LIMIT ${plusOne ? limit + 1 : limit}`;
    if (offset) text += ` OFFSET ${offset}`;

    text += ';';

    const res = await this.postgres.query({text, values});

    const rows = res.rows.map(row => processRowSchedule({row}));

    return processSchedule(rows);

  };

}
