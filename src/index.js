import {JRFWSServer} from 'jrfws2'
import ConnectorPG from "./db/conectorPG";
import pathExists from 'jrf-path-exists'
import Films from "./model/Films";
import Halls from "./model/Halls";
import Tickets from "./model/Tickets";
import Schedules from "./model/Schedules";
import Logs from "./model/Logs";
import generateId from "./utils/generateId";

const config = require("../config");
const jrfwsServer = new JRFWSServer();
const processId = generateId();

let filmsModel;
let hallsModel;
let ticketsModel;
let schedulesModel;
let logsModel;

async function start() {

  const host = pathExists(config, 'postgres.host');
  const port = pathExists(config, 'postgres.port');
  const user = pathExists(config, 'postgres.user');
  const password = pathExists(config, 'postgres.password');
  const database = pathExists(config, 'postgres.database');

  const postgres = new ConnectorPG({host, port, user, password, database});
  await postgres.testConnect();

  filmsModel = new Films({postgres});
  hallsModel = new Halls({postgres});
  ticketsModel = new Tickets({postgres});
  schedulesModel = new Schedules({postgres});
  logsModel = new Logs({postgres, processId});

  await jrfwsServer.route({
    route: 'films', act: 'get', func: getFilms
  });

  await jrfwsServer.route({
    route: 'ages', act: 'get', func: getAges
  });

  await jrfwsServer.route({
    route: 'halls', act: 'get', func: () => 'halls'
  });

  await jrfwsServer.route({
    route: 'poster', func: getPoster
  });

  await jrfwsServer.route({
    route: 'schedules', act: 'get', func: getSchedules
  });

  await jrfwsServer.route({
    route: 'tickets', act: 'get', func: getTickets
  });

  await jrfwsServer.route({
    route: 'halls', act: 'get', func: getHalls
  });

  const portServer = pathExists(config, 'server.port');
  await jrfwsServer.startServer({port: portServer});
  console.log(`start server port: ${portServer}`);
  await logsModel.add({type: 'info', log: 'start dmikBackend', data: {time: new Date()}});

}


async function getAges({data, stop}) {

  let ages = [];

  try {

    ages = await filmsModel.ages();

    return ages;

  } catch (e) {

    await logsModel.add({type: 'error', log: e.message, data: {func: 'getAges', error: e.stack}});

  }

}

async function getPoster({data, stop}) {

  let poster = [];

  try {

    poster = await filmsModel.poster();

  } catch (e) {

    await logsModel.add({type: 'error', log: e.message, data: {func: 'getPoster', error: e.stack}});

  }

  return poster;

}

async function getFilms({data, stop}) {


  let films = [];

  try {

    const filter = pathExists(data, 'data.filter', {});
    films = await filmsModel.get({filter});

  } catch (e) {

    await logsModel.add({type: 'error', log: e.message, data: {func: 'getFilms', error: e.stack}});

  }

  return films;

}

async function getSchedules({data, stop}) {

  let schedules = [];

  try {

    const filter = pathExists(data, 'data.filter', {});
    schedules = await schedulesModel.get({filter});

  } catch (e) {

    await logsModel.add({type: 'error', log: e.message, data: {func: 'getSchedules', error: e.stack}});

  }

  return schedules;

}

async function getHalls({data, stop}) {

  let halls = [];

  try {

    halls = await hallsModel.get({});

  } catch (e) {

    await logsModel.add({type: 'error', log: e.message, data: {func: 'getHalls', error: e.stack}});

  }

  return halls;

}

async function getTickets({data, stop}) {

  let tickets = [];

  try {

    tickets = await ticketsModel.get({});

  } catch (e) {

    await logsModel.add({type: 'error', log: e.message, data: {func: 'getTickets', error: e.stack}});

  }

  return tickets;

}

Promise.resolve().then(start);