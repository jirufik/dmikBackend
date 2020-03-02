import pathExists from 'jrf-path-exists'
import moment from "moment";

export default function processRowFilms({row}) {

  const film = {
    code: pathExists(row, 'code'),
    name: pathExists(row, 'name'),
    age: pathExists(row, 'age'),
    img: pathExists(row, 'img'),
    runtime: pathExists(row, 'runtime'),
    dateEnd: pathExists(row, 'date_end'),
    inDays: pathExists(row, 'in_days'),
  };

  if (film.dateEnd) {
    const dateEnd = new Date(film.dateEnd);
    film.daysLeft = moment(dateEnd).startOf('day').diff(moment().startOf('day'), 'days');
  } else {
    film.daysLeft = null;
  }

  return film;

}