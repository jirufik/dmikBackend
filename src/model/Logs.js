export default class Logs {

  constructor({postgres, processId}) {

    this.postgres = postgres;
    this.processId = processId;

  }

  async add({type = 'other', service = 'dmik backend', log = 'empty', data, processId}) {

    try {

      const values = [];

      if (typeof data !== 'object') {
        data = {data: data};
      }

      processId = processId || this.processId || 'noId';

      const text = `INSERT INTO logs(type, service, process_id, log, data)
                    VALUES ($1, $2, $3, $4, $5) RETURNING * ;`;

      values.push(type);
      values.push(service);
      values.push(processId);
      values.push(log);
      values.push(data);

      const res = await this.postgres.query({text, values});

      return res.rows;

    } catch (e) {
      console.error(`Log add error: ${e.message}`);
      console.error(e.stack);
    }

  }

}
