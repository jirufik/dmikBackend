import pathExists from 'jrf-path-exists'

export default function processSchedule(schedules) {

  // date -> halls -> times -> tickets

  if (!schedules.length) return [];

  const dates = [];
  let date = {
    date: schedules[0].date,
    halls: {}
  };

  for (const schedule of schedules) {

    const scheduleDate = schedule.date;

    const isEqual = scheduleDate - date.date === 0;

    if (isEqual) {

      processHall({date, schedule});

    } else {

      dates.push({...date});

      date = {
        date: scheduleDate,
        halls: {}
      };

      processHall({date, schedule});

    }

  }

  dates.push({...date});

  return dates;

}

function processHall({date, schedule}) {

  const hallId = pathExists(schedule, 'hall.id');
  if (!hallId) return;

  let hall = pathExists(date, `halls[${hallId}]`);

  if (!hall) {

    date.halls[hallId] = {
      hall: {...schedule.hall},
      times: []
    };

    hall = date.halls[hallId];

  }

  processTime({hall, schedule});

}

function processTime({hall, schedule}) {

  const datetime = schedule.datetime;
  if (!datetime) return;

  const length = hall.times.length;
  if (length) {

    const lastTime = hall.times[length - 1];
    const isEqual = datetime - lastTime.datetime === 0;
    if (isEqual) {
      lastTime.tickets.push({ticket: schedule.ticket, cost: schedule.cost});
    } else {
      hall.times.push({datetime, film: schedule.film, tickets: [{ticket: schedule.ticket, cost: schedule.cost}]});
    }

  } else {
    hall.times.push({datetime, film: schedule.film, tickets: [{ticket: schedule.ticket, cost: schedule.cost}]});
  }

}