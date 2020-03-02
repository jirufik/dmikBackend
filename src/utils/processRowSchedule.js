import pathExists from 'jrf-path-exists'

export default function processRowSchedule({row}) {

  const schedule = {
    date: pathExists(row, 'date'),
    datetime: pathExists(row, 'date_time'),
    cost: pathExists(row, 'cost'),
    film: {
      code: pathExists(row, 'code'),
      name: pathExists(row, 'name'),
      age: pathExists(row, 'age'),
      img: pathExists(row, 'img'),
      runtime: pathExists(row, 'runtime'),
    },
    hall: {
      id: pathExists(row, 'id_hall'),
      name: pathExists(row, 'hall_name'),
      description: pathExists(row, 'hall_description'),
    },
    ticket: {
      id: pathExists(row, 'id_ticket'),
      name: pathExists(row, 'ticket_name'),
      description: pathExists(row, 'ticket_description'),
    },
  };

  return schedule;

}