import pathExists from 'jrf-path-exists'
import moment from "moment";

export default function processRowFilms({row}) {

  const film = {
    code: pathExists(row, 'code'),
    name: pathExists(row, 'name'),
    year: pathExists(row, 'year'),
    tagline: pathExists(row, 'tagline'),
    country: pathExists(row, 'country'),
    age: pathExists(row, 'age'),
    about: pathExists(row, 'about'),
    genre: pathExists(row, 'genre'),
    producer: pathExists(row, 'producer'),
    img: pathExists(row, 'img'),
    originalName: pathExists(row, 'original_name'),
    idTmdb: pathExists(row, 'id_tmdb'),
    runtime: pathExists(row, 'runtime'),
    dateStart: pathExists(row, 'date_start'),
    dateEnd: pathExists(row, 'date_end'),
    rental: pathExists(row, 'rental'),
    soon: pathExists(row, 'soon'),
    vote: pathExists(row, 'vote'),
  };

  let schedule = pathExists(row, 'schedule', []);
  schedule = schedule.map(row => processSchedule({row}));
  film.schedule = schedule;

  return film;

}

function processSchedule({row}) {

  const schedule = {
    cost: pathExists(row, 'cost'),
    hall: pathExists(row, 'hall'),
    hallDescription: pathExists(row, 'hallDescription'),
    ticket: pathExists(row, 'ticket'),
    ticketDescription: pathExists(row, 'ticketDescription')
  };

  let date = pathExists(row, 'date');
  if (date) date = new Date(date);
  schedule.date = date;

  return schedule;

}