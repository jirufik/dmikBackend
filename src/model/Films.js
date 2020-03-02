import pathExists from 'jrf-path-exists'
import {xor} from 'lodash'
import processRowPoster from "../utils/processRowPoster";
import moment from "moment";
import processRowFilms from "../utils/processRowFilms";
import processRowSchedule from "../utils/processRowSchedule";

export default class Films {

  constructor({postgres}) {

    this.postgres = postgres;

  }

  async add({code, name, year, tagline, country, age, about, genre, producer, img, data}) {

    const films = await this.get({code});

    const values = [];

    if (!films || !films.length) {

      const text = `INSERT INTO films(code, name, year, tagline, country, age, about, genre, producer, img, data, created, version)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), 1) RETURNING * ;`;

      values.push(code);
      values.push(name);
      values.push(year);
      values.push(tagline);
      values.push(country);
      values.push(age);
      values.push(about);
      values.push(genre);
      values.push(producer);
      values.push(img);
      values.push(data);

      const res = await this.postgres.query({text, values});

      return res.rows;

    }

    const film = pathExists(films, '[0]');
    if (!film) return;

    const update = this._update({film, name, year, tagline, country, age, about, genre, producer, img});
    if (update) {
      const res = await this.edit({
        code,
        name,
        year,
        tagline,
        country,
        age,
        about,
        genre,
        producer,
        img,
        version: film.version
      });
      return res;
    }

    return [film];

  }

  async poster() {

    if (!this.postgres) throw new Error('Not initialized postgres');

    const text = `
      SELECT f.code, f.name, f.age, f.img, f.runtime, MAX(s."date") AS date_end,
      date_part('day', age(DATE(MIN(s1."date")), DATE(NOW()))) AS in_Days  
      FROM films f
      LEFT JOIN schedules s 
      ON f.code = s.code_film
      LEFT JOIN schedules s1
      ON f.code = s1.code_film
      WHERE s."date" IS NULL OR s."date" >= NOW()
      GROUP BY f.code
      ORDER BY code
    `;

    const res = await this.postgres.query({text});

    return res.rows.map(row => processRowPoster({row}));

  }

  async ages() {

    if (!this.postgres) throw new Error('Not initialized postgres');

    const text = `
      select distinct "age" from films
      where age > 0 and age is not null 
      order by "age";
    `;

    const res = await this.postgres.query({text});

    return res.rows;

  }

  async get({filter}) {

    if (!this.postgres) throw new Error('Not initialized postgres');

    const plusOne = filter.plusOne;
    const code = Number(filter.code);
    const date = filter.date;
    const search = filter.search;
    const offset = typeof filter.offset === 'number' && filter.offset;
    const limit = typeof filter.limit === "number" && filter.limit;
    const rental = filter.rental;
    const soon = filter.soon;
    const age = Number(filter.age);

    const strWhere = [];
    let valueNumber = 0;
    const values = [];

    if (date) {

      //1999-01-08 04:05:06
      const day = moment(date).format('YYYY-MM-DD');
      const dayStart = `${day} 00:00:00`;
      const dayEnd = `${day} 23:59:59`;

      strWhere.push(`date BETWEEN $${++valueNumber} AND $${++valueNumber}`);
      values.push(dayStart);
      values.push(dayEnd);

    }

    if (search) {
      strWhere.push(`(LOWER(f.name) LIKE $${++valueNumber} OR LOWER(f.original_name) LIKE $${valueNumber})`);
      values.push(`%${search}%`.toLowerCase());
    }

    if (age) {
      strWhere.push(`(f.age <= $${++valueNumber} OR f.age IS NULL)`);
      values.push(age);
    }

    if (code) {
      strWhere.push(`f.code = $${++valueNumber}`);
      values.push(code);
    }

    let text = `select f.code, f.name, f.year, f.tagline, f.country, f.age, f.about, f.genre, f.producer, f.img, f.vote, 
                f.original_name, f.id_tmdb, f.runtime, MAX(s."date") AS date_end, MIN(s."date") AS date_start, 
                (DATE(MAX(s."date")) > DATE(NOW()) AND DATE(NOW()) >= DATE(MIN(s."date"))) AS rental,
                (DATE(MIN(s."date")) > DATE(NOW()) OR MIN(s."date") IS NULL) AS soon,
                json_agg(json_build_object(
                'date', s."date",
                'cost', s."cost",
                'hall', h."name",
                'hallDescription', h.description,
                'ticket', t."name",
                'ticketDescription', t.description
                )) as schedule
                from films f
                left join schedules s 
                on f.code = s.code_film
                left join tickets t 
                on t.id = s.id_ticket
                left join halls h 
                on h.id = s.id_hall
`;
    text += strWhere.length ? ` WHERE ${strWhere.join(' AND ')}` : '';

    text += ` group by f.code`;
    const having = [];
    if (rental) having.push(`(DATE(MAX(s."date")) > DATE(NOW()) AND DATE(NOW()) >= DATE(MIN(s."date")))`);
    if (soon) having.push(`(DATE(MIN(s."date")) > DATE(NOW()) OR MIN(s."date") IS NULL)`);
    text += having.length ? ` HAVING ${having.join(' OR ')}` : '';
    text += ` order by code desc`;

    if (limit) text += ` LIMIT ${plusOne ? limit + 1 : limit}`;
    if (offset) text += ` OFFSET ${offset}`;

    text += ';';

    const res = await this.postgres.query({text, values});

    return res.rows.map(row => processRowFilms({row}));

  }

  async edit({code, name, year, tagline, country, age, about, genre, producer, img, data, version}) {

    const films = await this.get({code});

    const film = pathExists(films, '[0]');
    if (!film) throw new Error(`Not fount film with code: ${code}`);

    const curVersion = film.version;
    const badVersion = version !== curVersion;
    if (badVersion) {
      throw new Error(`Film has already been updated current version: ${curVersion}, our version: ${version}. Last update: ${film.updated}`);
    }

    const values = [];

    const text = `UPDATE films SET (name, year, tagline, country, age, about, genre, producer, img, data, updated, version) 
                  = ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)
                  WHERE code = ${code} RETURNING * ;`;

    values.push(name);
    values.push(year);
    values.push(tagline);
    values.push(country);
    values.push(age);
    values.push(about);
    values.push(genre);
    values.push(producer);
    values.push(img);
    values.push(data);
    values.push(++version);

    const res = await this.postgres.query({text, values});

    return res.rows;

  }

  _update({film, name, year, tagline, country, age, about, genre, producer, img}) {

    let update = film.name.toLowerCase() !== name.toLowerCase();
    if (update) return true;

    update = Number(film.year) !== year;
    if (update) return true;

    update = film.tagline.toLowerCase() !== tagline.toLowerCase();
    if (update) return true;

    update = xor(film.country, country).length;
    if (update) return true;

    update = Number(film.age) !== age;
    if (update) return true;

    update = film.about.toLowerCase() !== about.toLowerCase();
    if (update) return true;

    update = xor(film.genre, genre).length;
    if (update) return true;

    update = xor(film.producer, producer).length;
    if (update) return true;

    update = film.img.toLowerCase() !== img.toLowerCase();
    if (update) return true;

    return false;

  }

}
