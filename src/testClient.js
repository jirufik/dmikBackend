import {JRFWSClient} from 'jrfws2'
import pathExists from "jrf-path-exists";
import moment from "moment";

const config = require("../config");
const jrfwsClient = new JRFWSClient();

async function test() {

  const portServer = pathExists(config, 'server.port');
  await jrfwsClient.startClient({url: `ws://localhost:${portServer}`});

  jrfwsClient.onOpen = async () => {
    const res = await jrfwsClient.sendMes({
      route: 'schedules',
      act: 'get',
      data: {filter: {dateStart: new Date(), dateEnd: moment().add(1, 'days'), hallIds: [2]}},
      // data: {filter: {date: new Date()}},
      // data: {filter: {limit: 2, offset: 1}},
      // data: {filter: {search: 'lit'}},
      // data: {filter: {rental: true, search: 'ви'}},
      awaitRes: true
    });
    console.log(res);
    // console.log(JSON.stringify(res, null, 2));
  };

  // await wait();
  //
  // const res = await jrfwsClient.sendMes({route: 'films', act: 'get', awaitRes: true});
  // console.log(res);

}

function wait(mlsecond = 1000) {
  return new Promise(resolve => setTimeout(resolve, mlsecond));
}

Promise.resolve().then(test);